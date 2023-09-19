import * as PE from 'pe-library';
import { getBoolArrayFromBitmask, getNullTerminatedUtf8String, getUtf8String, roundUpToNearest } from './Helpers.js';
import { CliHeader, CliMetadataRoot, CliMetadataStreamHeader, CliMetadataTableStreamHeader, CliMetadataTables } from './Structures.js';
import { ModuleTable } from './ModuleTable.js';
import { StringHeap } from './StringHeap.js';
import { TypeRefTable } from './TypeRefTable.js';
import { TypeDefTable } from './TypeDefTable.js';

export class CliParser {
    public static getCliHeader(exe: PE.NtExecutable): Readonly<CliHeader> | null {
        const cliHeaderDirectoryEntry = exe.newHeader.optionalHeaderDataDirectory.get(PE.Format.ImageDirectoryEntry.ComDescriptor);
        const sectionContainingCliHeader = exe.getSectionByEntry(PE.Format.ImageDirectoryEntry.ComDescriptor);
        if (!sectionContainingCliHeader || !sectionContainingCliHeader.data)
        {
            return null;
        }

        const cliHeaderOffsetInSection = cliHeaderDirectoryEntry.virtualAddress - sectionContainingCliHeader.info.virtualAddress;
        const view = new DataView(sectionContainingCliHeader.data, cliHeaderOffsetInSection, 72);
        return {
            cbSize: view.getUint32(0, true),
            majorRuntimeVersion: view.getUint16(4, true),
            minorRuntimeVersion: view.getUint16(6, true),
            metaData: this.getRVA(view, 8),
            flags: view.getUint32(16, true),
            entryPointToken: view.getUint32(20, true),
            resources: this.getRVA(view, 24),
            strongNameSignature: this.getRVA(view, 32),
            codeManagerTable: this.getRVA(view, 40),
            vTableFixups: this.getRVA(view, 48),
            exportAddressTableJumps: this.getRVA(view, 56),
            managedNativeHeader: this.getRVA(view, 64),
        };
    }

    public static getCliMetadataRoot(exe: PE.NtExecutable, metadataRva: Readonly<PE.Format.ImageDataDirectory>): Readonly<CliMetadataRoot> | null {
        const section = this.getSectionByRva(exe, metadataRva);
        if (!section || !section.data) {
            return null;
        }

        const metadataRootOffsetInSection = metadataRva.virtualAddress - section.info.virtualAddress;
        const view = new DataView(section.data, metadataRootOffsetInSection);

        const metadataRoot: CliMetadataRoot = {
            signature: view.getUint32(0, true),
            majorVersion: view.getUint16(4, true),
            minorVersion: view.getUint16(6, true),
            reserved: view.getUint32(8, true),
            versionLength: view.getUint32(12, true),
            version: "",
            flags: 0,
            streamCount: 0,
            streamHeaders: [],
        };

        const flagsOffset = 16 + roundUpToNearest(metadataRoot.versionLength, 4);
        metadataRoot.flags = view.getUint16(flagsOffset, true);
        metadataRoot.streamCount = view.getUint16(flagsOffset + 2, true);

        metadataRoot.version = getUtf8String(section.data, metadataRootOffsetInSection + 16, metadataRoot.versionLength);

        let offset = flagsOffset + 4;
        for (let i = 0; i < metadataRoot.streamCount; ++i) {
            const result = this.getCliMetadataStreamHeader(view, offset);
            metadataRoot.streamHeaders.push(result.header);
            offset += result.totalBytesRead;
        }

        return metadataRoot;
    }

    public static getMetadataStream(
        exe: PE.NtExecutable,
        metadataRva: Readonly<PE.Format.ImageDataDirectory>,
        metadataStreamHeader: Readonly<CliMetadataStreamHeader>) : DataView | null
    {
        const section = this.getSectionByRva(exe, metadataRva);
        if (!section || !section.data) {
            return null;
        }

        const metadataRootOffsetInSection = metadataRva.virtualAddress - section.info.virtualAddress;
        const metadataStreamOffset = metadataRootOffsetInSection + metadataStreamHeader.metadataRootOffset;
        return new DataView(section.data, metadataStreamOffset, metadataStreamHeader.streamSize);
    }

    public static getCliMetadataTableStreamHeader(
        exe: PE.NtExecutable,
        metadataRva: Readonly<PE.Format.ImageDataDirectory>,
        metadataRoot: Readonly<CliMetadataRoot>): Readonly<CliMetadataTableStreamHeader> | null
    {    
        const metadataStreamHeader = metadataRoot.streamHeaders.find(h => h.streamName === "#~");
        if (!metadataStreamHeader) {
            return null;
        }

        const metadataStream = this.getMetadataStream(exe, metadataRva, metadataStreamHeader);
        if (!metadataStream) {
            return null;
        }

        return this.readCliMetadataTableHeader(metadataStream).header;
    }

    public static getCliMetadataTables(exe: PE.NtExecutable,
        metadataRva: Readonly<PE.Format.ImageDataDirectory>,
        metadataRoot: Readonly<CliMetadataRoot>) : CliMetadataTables | null
    {
        const metadataStreamHeader = metadataRoot.streamHeaders.find(h => h.streamName === "#~");
        if (!metadataStreamHeader) {
            return null;
        }

        const metadataStream = this.getMetadataStream(exe, metadataRva, metadataStreamHeader);
        if (!metadataStream) {
            return null;
        }

        const stringHeapStreamHeader = metadataRoot.streamHeaders.find(h => h.streamName === "#Strings");
        if (!stringHeapStreamHeader) {
            return null;
        }
        const stringHeapStream = this.getMetadataStream(exe, metadataRva, stringHeapStreamHeader);
        if (!stringHeapStream) {
            return null;
        }
        const stringHeap = new StringHeap(stringHeapStream);

        const headerReadResult = this.readCliMetadataTableHeader(metadataStream);
        const header = headerReadResult.header;

        let offset = headerReadResult.totalBytesRead;
        const moduleTableReadResult = ModuleTable.fromBytes(metadataStream, offset, header, stringHeap);
        offset += moduleTableReadResult?.bytesRead || 0;
        const typeRefTableReadResult = TypeRefTable.fromBytes(metadataStream, offset, header, stringHeap);
        offset += typeRefTableReadResult?.bytesRead || 0;
        const typeDefTableReadResult = TypeDefTable.fromBytes(metadataStream, offset, header, stringHeap);
        offset += typeDefTableReadResult?.bytesRead || 0;

        return {
            moduleTable: moduleTableReadResult ? moduleTableReadResult.table : null,
            typeRefTable: typeRefTableReadResult ? typeRefTableReadResult.table : null,
            typeDefTable: typeDefTableReadResult ? typeDefTableReadResult.table : null,
        }
    }

    private static readCliMetadataTableHeader(view: DataView) : StreamTableHeaderParseResult
    {
        const header: CliMetadataTableStreamHeader = {
            reserved: view.getUint32(0, true),
            majorVersion: view.getUint8(4),
            minorVersion: view.getUint8(5),
            heapSizes: view.getUint8(6),
            reserved2: view.getUint8(7),
            presentTables: getBoolArrayFromBitmask(view.getBigUint64(8, true)),
            sortedTables: getBoolArrayFromBitmask(view.getBigUint64(16, true)),
            tableRowCounts: [],
        };

        const numTables = header.presentTables.reduce((acc, val) => acc + (val ? 1 : 0), 0);
        let tableIndex = 0;
        for (let i = 0; i < header.presentTables.length; ++i) {
            if (header.presentTables[i])
            {
                const rowCount = view.getUint32(24 + tableIndex * 4, true);
                ++tableIndex;
                header.tableRowCounts.push(rowCount);
            }
            else
            {
                header.tableRowCounts.push(0);
            }
        }

        return {
            header: header,
            totalBytesRead: 24 + numTables * 4,
        };
    }

    private static getCliMetadataStreamHeader(view: DataView, offset: number): StreamHeaderParseResult {
        const header: CliMetadataStreamHeader = {
            metadataRootOffset: view.getUint32(offset, true),
            streamSize: view.getUint32(offset + 4, true),
            streamName: "",
        };

        const stringReadResult = getNullTerminatedUtf8String(view, offset + 8);
        header.streamName = stringReadResult.string;

        return {
            header: header,
            totalBytesRead: 8 + roundUpToNearest(stringReadResult.bytesRead + 1, 4), // string must have at least one trailing \0 character
        };
    }

    private static getSectionByRva(exe: PE.NtExecutable, rva: Readonly<PE.Format.ImageDataDirectory>): Readonly<PE.NtExecutableSection> | null {
        const section = exe.getAllSections().find(s => {
            const sectionEnd = s.info.virtualAddress + s.info.virtualSize;
            return rva.virtualAddress >= s.info.virtualAddress && rva.virtualAddress < sectionEnd;
        });
        return section ? section : null;
    }

    private static getRVA(dv: DataView, offset: number) : Readonly<PE.Format.ImageDataDirectory> {
        return {
            virtualAddress: dv.getUint32(offset, true),
            size: dv.getUint32(offset + 4, true),
        };
    }
}

interface StreamHeaderParseResult {
    header: CliMetadataStreamHeader;
    totalBytesRead: number;
}

interface StreamTableHeaderParseResult {
    header: CliMetadataTableStreamHeader;
    totalBytesRead: number;
}