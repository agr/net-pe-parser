import * as PE from 'pe-library';
import { ModuleTableRow, TypeRefTableRow, TypeDefTableRow, FieldTableRow, MethodDefRow, ParamRow } from './Table.js';

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
    StandaloneSig = 0x11,
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
}
