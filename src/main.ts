import * as PE from 'pe-library';
import { getBoolArrayFromBitmask, getNullTerminatedUtf8String, getUtf8String, roundUpToNearest } from './Helpers.js';
import { CliHeader, CliMetadataRoot, CliMetadataStreamHeader, CliMetadataTableStreamHeader, CliMetadataTables, HeapSizes, MetadataTables } from './Structures.js';
import { ModuleTableRow, TypeRefTableRow, TypeDefTableRow, FieldTableRow, MethodDefRow, ParamRow, InterfaceImplRow, MemberRefRow, ConstantRow, CustomAttributeRow, FieldMarshalRow, DeclSecurityRow, ClassLayoutRow, FieldLayoutRow, StandAloneSigRow, EventMapRow, EventRow, PropertyMapRow, PropertyRow, MethodSemanticsRow } from './Table.js';
import { StringHeap } from './StringHeap.js';
import { GuidHeap } from './GuidHeap.js';
import * as Table from './Table.js'
import { BinaryHeap } from './BinaryHeap.js';

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

        const guidHeapStreamHeader = metadataRoot.streamHeaders.find(h => h.streamName === "#GUID");
        if (!guidHeapStreamHeader) {
            return null;
        }

        const guidHeapStream = this.getMetadataStream(exe, metadataRva, guidHeapStreamHeader);
        if (!guidHeapStream) {
            return null;
        }

        const blobHeapStreamHeader = metadataRoot.streamHeaders.find(h => h.streamName === "#Blob");
        if (!blobHeapStreamHeader) {
            return null;
        }

        const blobHeapStream = this.getMetadataStream(exe, metadataRva, blobHeapStreamHeader);
        if (!blobHeapStream) {
            return null;
        }

        const headerReadResult = this.readCliMetadataTableHeader(metadataStream);
        const header = headerReadResult.header;
        const stringHeap = new StringHeap(stringHeapStream, header.heapSizes & HeapSizes.StringStreamUses32BitIndexes ? 4 : 2);
        const guidHeap = new GuidHeap(guidHeapStream, header.heapSizes & HeapSizes.GuidStreamUses32BitIndexes ? 4 : 2);
        const blobHeap = new BinaryHeap(blobHeapStream, header.heapSizes & HeapSizes.BlobStreamUses32BitIndexes ? 4 : 2);

        let offset = headerReadResult.totalBytesRead;
        const moduleTableReadResult = Table.getRowsFromBytes(MetadataTables.Module, metadataStream, offset, () => new ModuleTableRow(), Table.getModuleTableColumns(stringHeap, guidHeap), header);
        offset += moduleTableReadResult.bytesRead || 0;
        const typeRefTableReadResult = Table.getRowsFromBytes(MetadataTables.TypeRef, metadataStream, offset, () => new TypeRefTableRow(), Table.getTypeRefTableColumn(header, stringHeap), header);
        offset += typeRefTableReadResult.bytesRead || 0;
        const typeDefTableReadResult = Table.getRowsFromBytes(MetadataTables.TypeDef, metadataStream, offset, () => new TypeDefTableRow(), Table.getTypeDefTableColumn(header, stringHeap), header);
        offset += typeDefTableReadResult.bytesRead || 0;
        const fieldTableReadResult = Table.getRowsFromBytes(MetadataTables.Field, metadataStream, offset, () => new FieldTableRow(), Table.getFieldTableColumn(stringHeap, blobHeap), header);
        offset += fieldTableReadResult.bytesRead || 0;
        const methodDefReadResult = Table.getRowsFromBytes(MetadataTables.MethodDef, metadataStream, offset, () => new MethodDefRow(), Table.getMethodDefTableColumn(header, stringHeap, blobHeap), header);
        offset += methodDefReadResult.bytesRead || 0;
        const paramReadResult = Table.getRowsFromBytes(MetadataTables.Param, metadataStream, offset, () => new ParamRow(), Table.getParamTableColumn(stringHeap), header);
        offset += paramReadResult.bytesRead || 0;
        const interfaceImplReadResult = Table.getRowsFromBytes(MetadataTables.InterfaceImpl, metadataStream, offset, () => new InterfaceImplRow(), Table.getInterfaceImplColumn(header), header);
        offset += interfaceImplReadResult.bytesRead || 0;
        const memberRefReadResult = Table.getRowsFromBytes(MetadataTables.MemberRef, metadataStream, offset, () => new MemberRefRow, Table.getMemberRefColumn(header, stringHeap, blobHeap), header);
        offset += memberRefReadResult.bytesRead || 0;
        const constantReadResult = Table.getRowsFromBytes(MetadataTables.Constant, metadataStream, offset, () => new ConstantRow(), Table.getConstantColumn(header, blobHeap), header);
        offset += constantReadResult.bytesRead || 0;
        const customAttributeReadResult = Table.getRowsFromBytes(MetadataTables.CustomAttribute, metadataStream, offset, () => new CustomAttributeRow(), Table.getCustomAttributeColumn(header, blobHeap), header);
        offset += customAttributeReadResult.bytesRead || 0;
        const fieldMarshalReadResult = Table.getRowsFromBytes(MetadataTables.FieldMarshal, metadataStream, offset, () => new FieldMarshalRow(), Table.getFieldMarshalColumn(header, blobHeap), header);
        offset += fieldMarshalReadResult.bytesRead || 0;
        const declSecurityReadResult = Table.getRowsFromBytes(MetadataTables.DeclSecurity, metadataStream, offset, () => new DeclSecurityRow, Table.getDeclSecurityColumn(header, blobHeap), header);
        offset += declSecurityReadResult.bytesRead || 0;
        const classLayoutReadResult = Table.getRowsFromBytes(MetadataTables.ClassLayout, metadataStream, offset, () => new ClassLayoutRow(), Table.getClassLayoutColumn(header), header);
        offset += classLayoutReadResult.bytesRead || 0;
        const fieldLayoutReadResult = Table.getRowsFromBytes(MetadataTables.FieldLayout, metadataStream, offset, () => new FieldLayoutRow(), Table.getFieldLayoutColumn(header), header);
        offset += fieldLayoutReadResult.bytesRead || 0;
        const standAloneSigReadResult = Table.getRowsFromBytes(MetadataTables.StandAloneSig, metadataStream, offset, () => new StandAloneSigRow(), Table.getStandAloneSigColumn(blobHeap), header);
        offset += standAloneSigReadResult.bytesRead || 0;
        const eventMapReadResult = Table.getRowsFromBytes(MetadataTables.EventMap, metadataStream, offset, () => new EventMapRow(), Table.getEventMapColumn(header), header);
        offset += eventMapReadResult.bytesRead || 0;
        const eventReadResult = Table.getRowsFromBytes(MetadataTables.Event, metadataStream, offset, () => new EventRow(), Table.getEventColumn(header, stringHeap), header);
        offset += eventReadResult.bytesRead || 0;
        const propertyMapReadResult = Table.getRowsFromBytes(MetadataTables.PropertyMap, metadataStream, offset, () => new PropertyMapRow(), Table.getPropertyMapColumn(header), header);
        offset += propertyMapReadResult.bytesRead || 0;
        const propertyReadResult = Table.getRowsFromBytes(MetadataTables.Property, metadataStream, offset, () => new PropertyRow(), Table.getPropertyColumn(stringHeap, blobHeap), header);
        offset += propertyReadResult.bytesRead || 0;
        const methodSemanticsReadResult = Table.getRowsFromBytes(MetadataTables.MethodSemantics, metadataStream, offset, () => new MethodSemanticsRow(), Table.getMethodSemanticsColumn(header), header);
        offset += methodSemanticsReadResult.bytesRead || 0;

        return {
            moduleTable: moduleTableReadResult ? moduleTableReadResult.rows : null,
            typeRefTable: typeRefTableReadResult ? typeRefTableReadResult.rows : null,
            typeDefTable: typeDefTableReadResult ? typeDefTableReadResult.rows : null,
            fieldTable: fieldTableReadResult ? fieldTableReadResult.rows : null,
            methodDefTable: methodDefReadResult ? methodDefReadResult.rows : null,
            paramTable: paramReadResult ? paramReadResult.rows : null,
            interfaceImplTable: interfaceImplReadResult ? interfaceImplReadResult.rows : null,
            memberRefTable: memberRefReadResult ? memberRefReadResult.rows : null,
            constantTable: constantReadResult ? constantReadResult.rows : null,
            customAttributeTable: customAttributeReadResult ? customAttributeReadResult.rows : null,
            fieldMarshalTable: fieldMarshalReadResult ? fieldMarshalReadResult.rows : null,
            declSecurityTable: declSecurityReadResult ? declSecurityReadResult.rows : null,
            classLayoutTable: classLayoutReadResult ? classLayoutReadResult.rows : null,
            fieldLayoutTable: fieldLayoutReadResult ? fieldLayoutReadResult.rows : null,
            standAloneSigTable: standAloneSigReadResult ? standAloneSigReadResult.rows : null,
            eventMapTable: eventMapReadResult ? eventMapReadResult.rows : null,
            eventTable: eventReadResult ? eventReadResult.rows : null,
            propertyMapTable: propertyMapReadResult ? propertyMapReadResult.rows : null,
            propertyTable: propertyReadResult ? propertyReadResult.rows : null,
            methodSemanticsTable: methodSemanticsReadResult ? methodSemanticsReadResult.rows : null,
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