import { BinaryHeap } from "./BinaryHeap.js";
import { BlobReferenceColumn } from "./Columns/BlobReferenceColumns.js";
import * as CodedIndex from "./Columns/CodedIndex.js"
import { CodedIndexColumn } from "./Columns/CodedIndexColumn.js";
import { Column } from "./Columns/Column.js";
import { GuidReferenceColumn } from "./Columns/GuidReferenceColumn.js";
import { StringReferenceColumn } from "./Columns/StringReferenceColumn.js";
import { TableIndexColumn } from "./Columns/TableIndexColumn.js";
import { UintColumn } from "./Columns/UintColumn.js";
import { GuidHeap } from "./GuidHeap.js";
import { StringHeap } from "./StringHeap.js";
import { CliMetadataTableStreamHeader, MetadataTables } from "./Structures.js";
import { ModuleTableRow, TypeRefTableRow, TypeDefTableRow, FieldTableRow, MethodDefRow, ParamRow, InterfaceImplRow, MemberRefRow, ConstantRow, CustomAttributeRow, FieldMarshalRow, DeclSecurityRow, ClassLayoutRow, FieldLayoutRow, StandAloneSigRow, EventMapRow, EventRow, PropertyMapRow, PropertyRow, MethodSemanticsRow, MethodImplRow, ModuleRefRow, TypeSpecRow, ImplMapRow, FieldRvaRow, AssemblyRow, AssemblyProcessorRow } from "./Tables.js";

export function getModuleTableColumns(
    stringHeap: Readonly<StringHeap>,
    guidHeap: Readonly<GuidHeap>): Column<ModuleTableRow>[]
{
    return [
        new UintColumn<ModuleTableRow>(2, (row, value) => row.generation = value),
        new StringReferenceColumn<ModuleTableRow>(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new GuidReferenceColumn<ModuleTableRow>(guidHeap.indexSizeBytes, (row, value) => row.mvidIndex = value),
        new GuidReferenceColumn<ModuleTableRow>(guidHeap.indexSizeBytes, (row, value) => row.encIdIndex = value),
        new GuidReferenceColumn<ModuleTableRow>(guidHeap.indexSizeBytes, (row, value) => row.encBaseIdIndex = value),
    ];
}

export function getTypeRefTableColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>): Column<TypeRefTableRow>[]
{
    return [
        new CodedIndexColumn(tableStreamHeader, CodedIndex.ResolutionScope, (row, index) => row.resolutionScopeCI = index),
        new StringReferenceColumn(stringHeap, (row, index) => row.typeNameIndex = index, (row, value) => row.typeName = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.typeNamespaceIndex = index, (row, value) => row.typeNamespace = value),
    ];
}

export function getTypeDefTableColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>): Column<TypeDefTableRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.flags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.typeNameIndex = index, (row, value) => row.typeName = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.typeNamespaceIndex = index, (row, value) => row.typeNamespace = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.TypeDefOrRef, (row, index) => row.extendsCI = index),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Field, (row, index) => row.fieldListIndex = index),
        new TableIndexColumn(tableStreamHeader, MetadataTables.MethodDef, (row, index) => row.methodListIndex = index),
    ];
}

export function getFieldTableColumn(
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>): Column<FieldTableRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.flags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.signatureIndex = index, (row, data) => row.signatureData = data),
    ];
}

export function getMethodDefTableColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>): Column<MethodDefRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.rva = value),
        new UintColumn(2, (row, value) => row.implFlags = value),
        new UintColumn(2, (row, value) => row.flags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.signatureIndex = index, (row, data) => row.signatureData = data),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Param, (row, index) => row.paramListIndex = index),
    ];
}

export function getParamTableColumn(
    stringHeap: Readonly<StringHeap>): Column<ParamRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.flags = value),
        new UintColumn(2, (row, value) => row.sequence = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
    ];
}

export function getInterfaceImplColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>): Column<InterfaceImplRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.classIndex = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.TypeDefOrRef, (row, index) => row.interfaceCI = index),
    ];
}

export function getMemberRefColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>): Column<MemberRefRow>[]
{
    return [
        new CodedIndexColumn(tableStreamHeader, CodedIndex.MemberRefParent, (row, index) => row.classCI = index),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.signatureIndex = index, (row, data) => row.signatureData = data),
    ];    
}

export function getConstantColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    blobHeap: Readonly<BinaryHeap>): Column<ConstantRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.type = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasConstant, (row, index) => row.parentCI = index),
        new BlobReferenceColumn(blobHeap, (row, index) => row.valueIndex = index, (row, data) => row.value = data),
    ];
}

export function getCustomAttributeColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    blobHeap: Readonly<BinaryHeap>): Column<CustomAttributeRow>[]
{
    return [
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasCustomAttribute, (row, index) => row.parentCI = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.CustomAttributeType, (row, index) => row.typeCI = index),
        new BlobReferenceColumn(blobHeap, (row, index) => row.valueIndex = index, (row, data) => row.value = data),
    ];
}

export function getFieldMarshalColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    blobHeap: Readonly<BinaryHeap>): Column<FieldMarshalRow>[]
{
    return [
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasFieldMarshall, (row, index) => row.parentCI = index),
        new BlobReferenceColumn(blobHeap, (row, index) => row.nativeTypeIndex = index, (row, data) => row.nativeType = data),
    ];
}

export function getDeclSecurityColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    blobHeap: Readonly<BinaryHeap>): Column<DeclSecurityRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.action = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasDeclSecurity, (row, index) => row.parentCI = index),
        new BlobReferenceColumn(blobHeap, (row, index) => row.permissionSetIndex = index, (row, data) => row.permissionSet = data),
    ];
}

export function getClassLayoutColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>): Column<ClassLayoutRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.packingSize = value),
        new UintColumn(4, (row, value) => row.classSize = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.parentIndex = index),
    ];
}

export function getFieldLayoutColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>): Column<FieldLayoutRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.offset = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Field, (row, index) => row.fieldIndex = index),
    ];
}

export function getStandAloneSigColumn(
    blobHeap: Readonly<BinaryHeap>): Column<StandAloneSigRow>[]
{
    return [
        new BlobReferenceColumn(blobHeap, (row, index) => row.signatureIndex = index, (row, data) => row.signatureData = data),
    ];
}

export function getEventMapColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>): Column<EventMapRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.parentIndex = index),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Event, (row, index) => row.eventListIndex = index),
    ];
}

export function getEventColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>): Column<EventRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.eventFlags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.TypeDefOrRef, (row, index) => row.eventTypeCI = index),
    ];
}

export function getPropertyMapColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>): Column<PropertyMapRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.parentIndex = index),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Property, (row, index) => row.propertyListIndex = index),
    ];
}

export function getPropertyColumn(
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>): Column<PropertyRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.flags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.typeIndex = index, (row, data) => row.typeData = data),
    ];
}

export function getMethodSemanticsColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>): Column<MethodSemanticsRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.semantics = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.MethodDef, (row, index) => row.methodIndex = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasSemantics, (row, index) => row.associationCI = index),
    ];
}

export function getMethodImplColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>): Column<MethodImplRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.classIndex = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.MethodDefOrRef, (row, index) => row.methodBodyCI = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.MethodDefOrRef, (row, index) => row.methodDeclarationCI = index),
    ];
}

export function getModuleRefColumn(
    stringHeap: Readonly<StringHeap>): Column<ModuleRefRow>[]
{
    return [
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
    ];
}

export function getTypeSpecColumn(
    blobHeap: Readonly<BinaryHeap>): Column<TypeSpecRow>[]
{
    return [
        new BlobReferenceColumn(blobHeap, (row, index) => row.signatureIndex = index, (row, data) => row.signatureData = data),
    ];
}

export function getImplMapColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>): Column<ImplMapRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.mappingFlags = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.MemberForwarded, (row, index) => row.memberForwardedCI = index),
        new StringReferenceColumn(stringHeap, (row, index) => row.importNameIndex = index, (row, value) => row.importName = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.ModuleRef, (row, index) => row.importScopeIndex = index),
    ];
}

export function getFieldRvaColumn(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>): Column<FieldRvaRow>[]
{
    return[
        new UintColumn(4, (row, value) => row.rva = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Field, (row, index) => row.fieldIndex = index),
    ];
}

export function getAssemblyColumn(
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>): Column<AssemblyRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.hashAlgId = value),
        new UintColumn(2, (row, value) => row.majorVersion = value),
        new UintColumn(2, (row, value) => row.minorVersion = value),
        new UintColumn(2, (row, value) => row.buildNumber = value),
        new UintColumn(2, (row, value) => row.revisionNumber = value),
        new UintColumn(4, (row, value) => row.flags = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.publicKeyIndex = index, (row, data) => row.publicKeyData = data),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.cultureIndex = index, (row, value) => row.culture = value),
    ];
}

export function getAssemblyProcessorColumn(): Column<AssemblyProcessorRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.processor = value),
    ];
}