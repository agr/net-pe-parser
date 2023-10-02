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
import { ModuleTableRow, TypeRefTableRow, TypeDefTableRow, FieldTableRow, MethodDefRow, ParamRow, InterfaceImplRow, MemberRefRow, ConstantRow, CustomAttributeRow, FieldMarshalRow, DeclSecurityRow, ClassLayoutRow, FieldLayoutRow, StandAloneSigRow, EventMapRow, EventRow, PropertyMapRow, PropertyRow, MethodSemanticsRow, MethodImplRow, ModuleRefRow, TypeSpecRow, ImplMapRow, FieldRvaRow, AssemblyRow, AssemblyProcessorRow, AssemblyOsRow, AssemblyRefRow, AssemblyRefProcessorRow, AssemblyRefOsRow, FileRow, ExportedTypeRow, ManifestResourceRow, NestedClassRow, GenericParamRow, MethodSpecRow, GenericParamConstraintRow } from "./Tables.js";

export interface GetColumns<TRow> {
    (tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
        stringHeap: Readonly<StringHeap>,
        blobHeap: Readonly<BinaryHeap>,
        guidHeap: Readonly<GuidHeap>): Column<TRow>[];
}

export function Module(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
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

export function TypeRef(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<TypeRefTableRow>[]
{
    return [
        new CodedIndexColumn(tableStreamHeader, CodedIndex.ResolutionScope, (row, index) => row.resolutionScopeCI = index),
        new StringReferenceColumn(stringHeap, (row, index) => row.typeNameIndex = index, (row, value) => row.typeName = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.typeNamespaceIndex = index, (row, value) => row.typeNamespace = value),
    ];
}

export function TypeDef(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<TypeDefTableRow>[]
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

export function Field(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<FieldTableRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.flags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.signatureIndex = index, (row, data) => row.signatureData = data),
    ];
}

export function MethodDef(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<MethodDefRow>[]
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

export function Param(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<ParamRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.flags = value),
        new UintColumn(2, (row, value) => row.sequence = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
    ];
}

export function Interface(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<InterfaceImplRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.classIndex = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.TypeDefOrRef, (row, index) => row.interfaceCI = index),
    ];
}

export function MemberRef(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<MemberRefRow>[]
{
    return [
        new CodedIndexColumn(tableStreamHeader, CodedIndex.MemberRefParent, (row, index) => row.classCI = index),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.signatureIndex = index, (row, data) => row.signatureData = data),
    ];    
}

export function Constant(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<ConstantRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.type = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasConstant, (row, index) => row.parentCI = index),
        new BlobReferenceColumn(blobHeap, (row, index) => row.valueIndex = index, (row, data) => row.value = data),
    ];
}

export function CustomAttribute(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<CustomAttributeRow>[]
{
    return [
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasCustomAttribute, (row, index) => row.parentCI = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.CustomAttributeType, (row, index) => row.typeCI = index),
        new BlobReferenceColumn(blobHeap, (row, index) => row.valueIndex = index, (row, data) => row.value = data),
    ];
}

export function FieldMarshal(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<FieldMarshalRow>[]
{
    return [
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasFieldMarshall, (row, index) => row.parentCI = index),
        new BlobReferenceColumn(blobHeap, (row, index) => row.nativeTypeIndex = index, (row, data) => row.nativeType = data),
    ];
}

export function DeclSecurity(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<DeclSecurityRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.action = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasDeclSecurity, (row, index) => row.parentCI = index),
        new BlobReferenceColumn(blobHeap, (row, index) => row.permissionSetIndex = index, (row, data) => row.permissionSet = data),
    ];
}

export function ClassLayout(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<ClassLayoutRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.packingSize = value),
        new UintColumn(4, (row, value) => row.classSize = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.parentIndex = index),
    ];
}

export function FieldLayout(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<FieldLayoutRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.offset = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Field, (row, index) => row.fieldIndex = index),
    ];
}

export function StandAloneSig(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<StandAloneSigRow>[]
{
    return [
        new BlobReferenceColumn(blobHeap, (row, index) => row.signatureIndex = index, (row, data) => row.signatureData = data),
    ];
}

export function EventMap(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<EventMapRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.parentIndex = index),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Event, (row, index) => row.eventListIndex = index),
    ];
}

export function Event(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<EventRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.eventFlags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.TypeDefOrRef, (row, index) => row.eventTypeCI = index),
    ];
}

export function PropertyMap(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<PropertyMapRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.parentIndex = index),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Property, (row, index) => row.propertyListIndex = index),
    ];
}

export function Property(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<PropertyRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.flags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.typeIndex = index, (row, data) => row.typeData = data),
    ];
}

export function MethodSemantics(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<MethodSemanticsRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.semantics = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.MethodDef, (row, index) => row.methodIndex = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.HasSemantics, (row, index) => row.associationCI = index),
    ];
}

export function MethodImpl(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<MethodImplRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.classIndex = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.MethodDefOrRef, (row, index) => row.methodBodyCI = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.MethodDefOrRef, (row, index) => row.methodDeclarationCI = index),
    ];
}

export function ModuleRef(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<ModuleRefRow>[]
{
    return [
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
    ];
}

export function TypeSpec(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<TypeSpecRow>[]
{
    return [
        new BlobReferenceColumn(blobHeap, (row, index) => row.signatureIndex = index, (row, data) => row.signatureData = data),
    ];
}

export function ImplMap(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<ImplMapRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.mappingFlags = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.MemberForwarded, (row, index) => row.memberForwardedCI = index),
        new StringReferenceColumn(stringHeap, (row, index) => row.importNameIndex = index, (row, value) => row.importName = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.ModuleRef, (row, index) => row.importScopeIndex = index),
    ];
}

export function FieldRva(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<FieldRvaRow>[]
{
    return[
        new UintColumn(4, (row, value) => row.rva = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.Field, (row, index) => row.fieldIndex = index),
    ];
}

export function Assembly(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<AssemblyRow>[]
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

export function AssemblyProcessor(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<AssemblyProcessorRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.processor = value),
    ];
}

export function AssemblyOs(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<AssemblyOsRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.osPlarformId = value),
        new UintColumn(4, (row, value) => row.osMajorVersion = value),
        new UintColumn(4, (row, value) => row.osMinorVersion = value),
    ];
}

export function AssemblyRef(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<AssemblyRefRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.majorVersion = value),
        new UintColumn(2, (row, value) => row.minorVersion = value),
        new UintColumn(2, (row, value) => row.buildNumber = value),
        new UintColumn(2, (row, value) => row.revisionNumber = value),
        new UintColumn(4, (row, value) => row.flags = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.publicKeyOrTokenIndex = index, (row, data) => row.publicKeyOrTokenData = data),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.cultureIndex = index, (row, value) => row.culture = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.hashValueIndex = index, (row, data) => row.hashValueData = data),
    ];
}

export function AssemblyRefProcessor(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<AssemblyRefProcessorRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.processor = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.AssemblyRef, (row, index) => row.assemblyRefIndex = index),
    ];
}

export function AssemblyRefOs(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<AssemblyRefOsRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.osPlarformId = value),
        new UintColumn(4, (row, value) => row.osMajorVersion = value),
        new UintColumn(4, (row, value) => row.osMinorVersion = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.AssemblyRef, (row, index) => row.assemblyRefIndex = index),
    ];
}

export function File(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<FileRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.flags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new BlobReferenceColumn(blobHeap, (row, index) => row.hashValueIndex = index, (row, data) => row.hashValue = data),
    ];
}

export function ExportedType(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<ExportedTypeRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.flags = value),
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.typeDefIdIndex = index),
        new StringReferenceColumn(stringHeap, (row, index) => row.typeNameIndex = index, (row, value) => row.typeName = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.typeNamespaceIndex = index, (row, value) => row.typeNamespace = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.Implementation, (row, index) => row.implementationCI = index),
    ];
}

export function ManifestResource(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<ManifestResourceRow>[]
{
    return [
        new UintColumn(4, (row, value) => row.offset = value),
        new UintColumn(4, (row, value) => row.flags = value),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.Implementation, (row, index) => row.implementationCI = index),
    ];
}

export function NestedClass(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<NestedClassRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.nestedClassIndex = index),
        new TableIndexColumn(tableStreamHeader, MetadataTables.TypeDef, (row, index) => row.enclosingClassIndex = index),
    ];
}

export function GenericParam(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<GenericParamRow>[]
{
    return [
        new UintColumn(2, (row, value) => row.number = value),
        new UintColumn(2, (row, value) => row.flags = value),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.TypeOrMethodDef, (row, index) => row.ownerCI = index),
        new StringReferenceColumn(stringHeap, (row, index) => row.nameIndex = index, (row, value) => row.name = value),
    ];
}

export function MethodSpec(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<MethodSpecRow>[]
{
    return [
        new CodedIndexColumn(tableStreamHeader, CodedIndex.MethodDefOrRef, (row, index) => row.methodCI = index),
        new BlobReferenceColumn(blobHeap, (row, index) => row.instantiationIndex = index, (row, data) => row.instantiation = data),
    ];
}

export function GenericParamConstraint(
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>,
    blobHeap: Readonly<BinaryHeap>,
    guidHeap: Readonly<GuidHeap>): Column<GenericParamConstraintRow>[]
{
    return [
        new TableIndexColumn(tableStreamHeader, MetadataTables.GenericParamConstraint, (row, index) => row.ownerIndex = index),
        new CodedIndexColumn(tableStreamHeader, CodedIndex.TypeDefOrRef, (row, index) => row.constraintCI = index),
    ];
}