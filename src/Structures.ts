import * as PE from 'pe-library';
import { ModuleTableRow, TypeRefTableRow, TypeDefTableRow, FieldTableRow, MethodDefRow, ParamRow, InterfaceImplRow, MemberRefRow, ConstantRow, CustomAttributeRow, FieldMarshalRow, DeclSecurityRow, ClassLayoutRow, FieldLayoutRow, StandAloneSigRow, EventMapRow, EventRow, PropertyMapRow, PropertyRow, MethodSemanticsRow, MethodImplRow, ModuleRefRow, TypeSpecRow, ImplMapRow, FieldRvaRow, AssemblyRow, AssemblyProcessorRow, AssemblyOsRow, AssemblyRefRow, AssemblyRefProcessorRow, AssemblyRefOsRow, FileRow, ExportedTypeRow, ManifestResourceRow } from './Tables.js';

export interface CliHeader {
    cbSize: number;
    majorRuntimeVersion: number;
    minorRuntimeVersion: number;
    metaData: Readonly<PE.Format.ImageDataDirectory>;
    flags: number;
    entryPointToken: number;
    resources: Readonly<PE.Format.ImageDataDirectory>;
    strongNameSignature: Readonly<PE.Format.ImageDataDirectory>;
    codeManagerTable: Readonly<PE.Format.ImageDataDirectory>;
    vTableFixups: Readonly<PE.Format.ImageDataDirectory>;
    exportAddressTableJumps: Readonly<PE.Format.ImageDataDirectory>;
    managedNativeHeader: Readonly<PE.Format.ImageDataDirectory>;
}

export interface CliMetadataRoot {
    signature: number;
    majorVersion: number;
    minorVersion: number;
    reserved: number;
    versionLength: number;
    version: string;
    flags: number;
    streamCount: number;
    streamHeaders: Array<CliMetadataStreamHeader>;
}

export interface CliMetadataStreamHeader {
    metadataRootOffset: number;
    streamSize: number;
    streamName: string;
}

export enum HeapSizes {
    StringStreamUses32BitIndexes = 1,
    GuidStreamUses32BitIndexes = 2,
    BlobStreamUses32BitIndexes = 4,
}

export enum MetadataTables {
    Module = 0x00,
    TypeRef = 0x01,
    TypeDef = 0x02,
    Field = 0x04,
    MethodDef = 0x06,
    Param = 0x08,
    InterfaceImpl = 0x09,
    MemberRef = 0x0A,
    Constant = 0x0B,
    CustomAttribute = 0x0C,
    FieldMarshal = 0x0D,
    DeclSecurity = 0x0E,
    ClassLayout = 0x0F,
    FieldLayout = 0x10,
    StandAloneSig = 0x11,
    EventMap = 0x12,
    Event = 0x14,
    PropertyMap = 0x15,
    Property = 0x17,
    MethodSemantics = 0x18,
    MethodImpl = 0x19,
    ModuleRef = 0x1A,
    TypeSpec = 0x1B,
    ImplMap = 0x1C,
    FieldRVA = 0x1D,
    Assembly = 0x20,
    AssemblyProcessor = 0x21,
    AssemblyOS = 0x22,
    AssemblyRef = 0x23,
    AssemblyRefProcessor = 0x24,
    AssemblyRefOS = 0x25,
    File = 0x26,
    ExportedType = 0x27,
    ManifestResource = 0x28,
    NestedClass = 0x29,
    GenericParam = 0x2A,
    MethodSpec = 0x2B,
    GenericParamConstraint = 0x2C,

    // TODO: figure out what is Permission in HasCustomAttribute coded index
    Permission = 0xC0, // fake value to map in HasCustomAttribute coded index
    NotUsed = 0xC1,  // fake value to map in CustomAttributeType coded index to unused tags
}

// II.23.1.16
export enum ElementType {
    END = 0x00,
    VOID = 0x01,
    BOOLEAN = 0x02,
    CHAR = 0x03,
    I1 = 0x04,
    U1 = 0x05,
    I2 = 0x06,
    U2 = 0x07,
    I4 = 0x08,
    U4 = 0x09,
    I8 = 0x0a,
    U8 = 0x0b,
    R4 = 0x0c,
    R8 = 0x0d,
    STRING = 0x0e,
    PTR = 0x0f,
    BYREF = 0x10,
    VALUETYPE = 0x11,
    CLASS = 0x12,
    VAR = 0x13,
    ARRAY = 0x14,
    GENERICINST = 0x15,
    TYPEDBYREF = 0x16,
    I = 0x18,
    U = 0x19,
    FNPTR = 0x1b,
    OBJECT = 0x1c,
    SZARRAY = 0x1d,
    MVAR = 0x1e,
    CMOD_REQD = 0x1f,
    CMOD_OPT = 0x20,
    INTERNAL = 0x21,
    MODIFIER = 0x40,
    SENTINEL = 0x41,
    PINNED = 0x45,

    Type = 0x50,
    Boxed = 0x51,
    Reserved = 0x52,
    Field = 0x53,
    Property = 0x54,
    Enum = 0x55,    
}

export interface CliMetadataTableStreamHeader {
    reserved: number;
    majorVersion: number;
    minorVersion: number;
    heapSizes: number;
    reserved2: number;
    presentTables: Array<boolean>;
    sortedTables: Array<boolean>;
    tableRowCounts: Array<number>;
    //tables: Array<any>;
}

export interface CliMetadataTables {
    moduleTable: Readonly<ModuleTableRow[]> | null;
    typeRefTable: Readonly<TypeRefTableRow[]> | null;
    typeDefTable: Readonly<TypeDefTableRow[]> | null;
    fieldTable: Readonly<FieldTableRow[]> | null;
    methodDefTable: Readonly<MethodDefRow[]> | null;
    paramTable: Readonly<ParamRow[]> | null;
    interfaceImplTable: Readonly<InterfaceImplRow[]> | null;
    memberRefTable: Readonly<MemberRefRow[]> | null;
    constantTable: Readonly<ConstantRow[]> | null;
    customAttributeTable: Readonly<CustomAttributeRow[]> | null;
    fieldMarshalTable: Readonly<FieldMarshalRow[]> | null;
    declSecurityTable: Readonly<DeclSecurityRow[]> | null;
    classLayoutTable: Readonly<ClassLayoutRow[]> | null;
    fieldLayoutTable: Readonly<FieldLayoutRow[]> | null;
    standAloneSigTable: Readonly<StandAloneSigRow[]> | null;
    eventMapTable: Readonly<EventMapRow[]> | null;
    eventTable: Readonly<EventRow[]> | null;
    propertyMapTable: Readonly<PropertyMapRow[]> | null;
    propertyTable: Readonly<PropertyRow[]> | null;
    methodSemanticsTable: Readonly<MethodSemanticsRow[]> | null;
    methodImplTable: Readonly<MethodImplRow[]> | null;
    moduleRefTable: Readonly<ModuleRefRow[]> | null;
    typeSpecTable: Readonly<TypeSpecRow[]> | null;
    implMapTable: Readonly<ImplMapRow[]> | null;
    fieldRvaTable: Readonly<FieldRvaRow[]> | null;
    assemblyTable: Readonly<AssemblyRow[]> | null;
    assemblyProcessorTable: Readonly<AssemblyProcessorRow[]> | null;
    assemblyOsTable: Readonly<AssemblyOsRow[]> | null;
    assemblyRefTable: Readonly<AssemblyRefRow[]> | null;
    assemblyRefProcessorTable: Readonly<AssemblyRefProcessorRow[]> | null;
    assemblyRefOsTable: Readonly<AssemblyRefOsRow[]> | null;
    fileTable: Readonly<FileRow[]> | null;
    exportedTypeTable: Readonly<ExportedTypeRow[]> | null;
    manifestResourceTable: Readonly<ManifestResourceRow[]> | null;
}
