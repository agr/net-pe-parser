import * as PE from 'pe-library';
import { getBoolArrayFromBitmask, getNullTerminatedUtf8String, getUtf8String, roundUpToNearest } from './Helpers.js';
import { CliHeader, CliMetadataRoot, CliMetadataStreamHeader, CliMetadataTableStreamHeader, CliMetadataTables, HeapSizes, MetadataTables } from './Structures.js';
import { ModuleTableRow, TypeRefTableRow, TypeDefTableRow, FieldTableRow, MethodDefRow, ParamRow, InterfaceImplRow, MemberRefRow, ConstantRow, CustomAttributeRow, FieldMarshalRow, DeclSecurityRow, ClassLayoutRow, FieldLayoutRow, StandAloneSigRow, EventMapRow, EventRow, PropertyMapRow, PropertyRow, MethodSemanticsRow, MethodImplRow, ModuleRefRow, TypeSpecRow, ImplMapRow, FieldRvaRow, AssemblyRow, AssemblyProcessorRow, getRowsFromBytes, AssemblyOsRow, AssemblyRefRow, AssemblyRefProcessorRow, AssemblyRefOsRow, FileRow, ExportedTypeRow, ManifestResourceRow, NestedClassRow, GenericParamRow, MethodSpecRow, GenericParamConstraintRow } from './Tables.js';
import { StringHeap } from './StringHeap.js';
import { GuidHeap } from './GuidHeap.js';
import * as Columns from './TableColumns.js'
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

        function readTable<TRow>(
            table: MetadataTables,
            createRow: () => TRow,
            getColumns: Columns.GetColumns<TRow>): TRow[] | null
        {
            const columns = getColumns(header, stringHeap, blobHeap, guidHeap);
            const result = getRowsFromBytes(table, metadataStream!, offset, createRow, columns, header);
            offset += result.bytesRead || 0;
            return result.rows;
        }

        const module = readTable(MetadataTables.Module, () => new ModuleTableRow(), Columns.Module);
        const typeRef = readTable(MetadataTables.TypeRef, () => new TypeRefTableRow(), Columns.TypeRef);
        const typeDef = readTable(MetadataTables.TypeDef, () => new TypeDefTableRow(), Columns.TypeDef);
        const field = readTable(MetadataTables.Field, () => new FieldTableRow(), Columns.Field);
        const methodDef = readTable(MetadataTables.MethodDef, () => new MethodDefRow(), Columns.MethodDef);
        const param = readTable(MetadataTables.Param, () => new ParamRow(), Columns.Param);
        const interfaceImpl = readTable(MetadataTables.InterfaceImpl, () => new InterfaceImplRow(), Columns.Interface);
        const memberRef = readTable(MetadataTables.MemberRef, () => new MemberRefRow, Columns.MemberRef);
        const constant = readTable(MetadataTables.Constant, () => new ConstantRow(), Columns.Constant);
        const customAttribute = readTable(MetadataTables.CustomAttribute, () => new CustomAttributeRow(), Columns.CustomAttribute);
        const fieldMarshal = readTable(MetadataTables.FieldMarshal, () => new FieldMarshalRow(), Columns.FieldMarshal);
        const declSecurity = readTable(MetadataTables.DeclSecurity, () => new DeclSecurityRow, Columns.DeclSecurity);
        const classLayout = readTable(MetadataTables.ClassLayout, () => new ClassLayoutRow(), Columns.ClassLayout);
        const fieldLayout = readTable(MetadataTables.FieldLayout, () => new FieldLayoutRow(), Columns.FieldLayout);
        const standAloneSig = readTable(MetadataTables.StandAloneSig, () => new StandAloneSigRow(), Columns.StandAloneSig);
        const eventMap = readTable(MetadataTables.EventMap, () => new EventMapRow(), Columns.EventMap);
        const event = readTable(MetadataTables.Event, () => new EventRow(), Columns.Event);
        const propertyMap = readTable(MetadataTables.PropertyMap, () => new PropertyMapRow(), Columns.PropertyMap);
        const property = readTable(MetadataTables.Property, () => new PropertyRow(), Columns.Property);
        const methodSemantics = readTable(MetadataTables.MethodSemantics, () => new MethodSemanticsRow(), Columns.MethodSemantics);
        const methodImpl = readTable(MetadataTables.MethodImpl, () => new MethodImplRow(), Columns.MethodImpl);
        const moduleRef = readTable(MetadataTables.ModuleRef, () => new ModuleRefRow(), Columns.ModuleRef);
        const typeSpec = readTable(MetadataTables.TypeSpec, () => new TypeSpecRow, Columns.TypeSpec);
        const implMap = readTable(MetadataTables.ImplMap, () => new ImplMapRow(), Columns.ImplMap);
        const fieldRva = readTable(MetadataTables.FieldRVA, () => new FieldRvaRow(), Columns.FieldRva);
        const assembly = readTable(MetadataTables.Assembly, () => new AssemblyRow(), Columns.Assembly);
        const assemblyProcessor = readTable(MetadataTables.AssemblyProcessor, () => new AssemblyProcessorRow, Columns.AssemblyProcessor);
        const assemblyOs = readTable(MetadataTables.AssemblyOS, () => new AssemblyOsRow(), Columns.AssemblyOs);
        const assemblyRef = readTable(MetadataTables.AssemblyRef, () => new AssemblyRefRow(), Columns.AssemblyRef);
        const assemblyRefProcessor = readTable(MetadataTables.AssemblyRefProcessor, () => new AssemblyRefProcessorRow(), Columns.AssemblyRefProcessor);
        const assemblyRefOs = readTable(MetadataTables.AssemblyRefOS, () => new AssemblyRefOsRow(), Columns.AssemblyRefOs);
        const file = readTable(MetadataTables.File, () =>  new FileRow(), Columns.File);
        const exportedType = readTable(MetadataTables.ExportedType, () => new ExportedTypeRow(), Columns.ExportedType);
        const manifestResource = readTable(MetadataTables.ManifestResource, () => new ManifestResourceRow(), Columns.ManifestResource);
        const nestedClass = readTable(MetadataTables.NestedClass, () => new NestedClassRow(), Columns.NestedClass);
        const genericParam = readTable(MetadataTables.GenericParam, () => new GenericParamRow(), Columns.GenericParam);
        const methodSpec = readTable(MetadataTables.MethodSpec, () => new MethodSpecRow(), Columns.MethodSpec);
        const genericParamConstraint = readTable(MetadataTables.GenericParamConstraint, () => new GenericParamConstraintRow(), Columns.GenericParamConstraint);

        setupFieldsAndMethods(typeDef, field, methodDef);

        return {
            moduleTable: module,
            typeRefTable: typeRef,
            typeDefTable: typeDef,
            fieldTable: field,
            methodDefTable: methodDef,
            paramTable: param,
            interfaceImplTable: interfaceImpl,
            memberRefTable: memberRef,
            constantTable: constant,
            customAttributeTable: customAttribute,
            fieldMarshalTable: fieldMarshal,
            declSecurityTable: declSecurity,
            classLayoutTable: classLayout,
            fieldLayoutTable: fieldLayout,
            standAloneSigTable: standAloneSig,
            eventMapTable: eventMap,
            eventTable: event,
            propertyMapTable: propertyMap,
            propertyTable: property,
            methodSemanticsTable: methodSemantics,
            methodImplTable: methodImpl,
            moduleRefTable: moduleRef,
            typeSpecTable: typeSpec,
            implMapTable: implMap,
            fieldRvaTable: fieldRva,
            assemblyTable: assembly,
            assemblyProcessorTable: assemblyProcessor,
            assemblyOsTable: assemblyOs,
            assemblyRefTable: assemblyRef,
            assemblyRefProcessorTable: assemblyRefProcessor,
            assemblyRefOsTable: assemblyRefOs,
            fileTable: file,
            exportedTypeTable: exportedType,
            manifestResourceTable: manifestResource,
            nestedClassTable: nestedClass,
            genericParamTable: genericParam,
            methodSpecTable: methodSpec,
            genericParamConstraintTable: genericParamConstraint,
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

function setupFieldsAndMethods(typeDef: TypeDefTableRow[] | null, field: FieldTableRow[] | null, methodDef: MethodDefRow[] | null) {
    if (typeDef === null) {
        return;
    }

    for (let i = 0; i < typeDef.length; ++i) {
        (function(){
            if (typeDef[i].fieldListIndex > 0 && field != null) {
                const start = typeDef[i].fieldListIndex - 1;
                if (start === field.length) {
                    return;
                }
                const end = i < typeDef.length - 1 ? typeDef[i + 1].fieldListIndex - 1 : field.length;
                if (start === end) {
                    return;
                }
                typeDef[i].fieldList = field.slice(start, end);
            }
        })();
        (function(){
            if (typeDef[i].methodListIndex > 0 && methodDef != null) {
                const start = typeDef[i].methodListIndex - 1;
                const end = i < typeDef.length - 1 ? typeDef[i + 1].methodListIndex - 1 : methodDef.length;
                if (start === end) {
                    return;
                }
                typeDef[i].methodList = methodDef.slice(start, end);
            }
        })();
    }
}
