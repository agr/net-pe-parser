import { Column } from "./Columns/Column.js";
import { CliMetadataTableStreamHeader, MetadataTables } from "./Structures.js";

export interface Table<TRow> {
    rows: TRow[];
    bytesRead: number;
}

export function getRowsFromBytes<TRow>(
    tableId: MetadataTables,
    original: DataView,
    byteOffset: number,
    createRow: () => TRow,
    columns: Column<TRow>[],
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>) : Table<TRow>
{
    if (!tableStreamHeader.presentTables[tableId] || tableStreamHeader.tableRowCounts[tableId] <= 0) {
        return {
            rows: [],
            bytesRead: 0,
        }
    }

    const view = new DataView(original.buffer, original.byteOffset + byteOffset);

    let offset = 0;
    let rows: TRow[] = [];
    for (let i = 0; i < tableStreamHeader.tableRowCounts[tableId]; ++i) {
        let row = createRow();

        for (const column of columns) {
            offset += column.read(view, offset, row);
        }

        rows.push(row);
    }

    return {
        rows: rows,
        bytesRead: offset,
    };
}

export class ModuleTableRow {
    generation: number = 0;
    nameIndex: number = 0;
    name: string = "";
    mvidIndex: number = 0;
    encIdIndex: number = 0;
    encBaseIdIndex: number = 0;
}

export class TypeRefTableRow {
    resolutionScopeCI: number = 0;
    typeNameIndex: number = 0;
    typeName: string = "";
    typeNamespaceIndex: number = 0;
    typeNamespace: string = "";
}

export class TypeDefTableRow {
    flags: number = 0;
    typeNameIndex: number = 0;
    typeName: string = "";
    typeNamespaceIndex: number = 0;
    typeNamespace: string = "";
    extendsCI: number = 0;
    fieldListIndex: number = 0;
    methodListIndex: number = 0;
}

const NoDataBuffer = new ArrayBuffer(0);
const NoData = new DataView(NoDataBuffer, 0, 0);

export class FieldTableRow {
    flags: number = 0;
    nameIndex: number = 0;
    name: string = "";
    signatureIndex: number = 0;
    signatureData: DataView = NoData;
}

export class MethodDefRow {
    rva: number = 0;
    implFlags: number = 0;
    flags: number = 0;
    nameIndex: number = 0;
    name: string = "";
    signatureIndex: number = 0;
    signatureData: DataView = NoData;
    paramListIndex: number = 0;
}

export class ParamRow {
    flags: number = 0;
    sequence: number = 0;
    nameIndex: number = 0;
    name: string = "";
}

export class InterfaceImplRow {
    classIndex: number = 0;
    interfaceCI: number = 0;
}

export class MemberRefRow {
    classCI: number = 0;
    nameIndex: number = 0;
    name: string = "";
    signatureIndex: number = 0;
    signatureData: DataView = NoData;
}

export class ConstantRow {
    type: number = 0;
    parentCI: number = 0;
    valueIndex: number = 0;
    value: DataView = NoData;
}

export class CustomAttributeRow {
    parentCI: number = 0;
    typeCI: number = 0;
    valueIndex: number = 0;
    value: DataView = NoData;
}

export class FieldMarshalRow {
    parentCI: number = 0;
    nativeTypeIndex: number = 0;
    nativeType: DataView = NoData;
}

export class DeclSecurityRow {
    action: number = 0;
    parentCI: number = 0;
    permissionSetIndex: number = 0;
    permissionSet: DataView = NoData;
}

export class ClassLayoutRow {
    packingSize: number = 0;
    classSize: number = 0;
    parentIndex: number = 0;
}

export class FieldLayoutRow {
    offset: number = 0;
    fieldIndex: number = 0;
}

export class StandAloneSigRow {
    signatureIndex: number = 0;
    signatureData: DataView = NoData;
}

export class EventMapRow {
    parentIndex: number = 0;
    eventListIndex: number = 0;
}

export class EventRow {
    eventFlags: number = 0;
    nameIndex: number = 0;
    name: string = "";
    eventTypeCI: number = 0;
}

export class PropertyMapRow {
    parentIndex: number = 0;
    propertyListIndex: number = 0;
}

export class PropertyRow {
    flags: number = 0;
    nameIndex: number = 0;
    name: string = "";
    typeIndex: number = 0;
    typeData: DataView = NoData;
}

export class MethodSemanticsRow {
    semantics: number = 0;
    methodIndex: number = 0;
    associationCI: number = 0;
}

export class MethodImplRow {
    classIndex: number = 0;
    methodBodyCI: number = 0;
    methodDeclarationCI: number = 0;
}

export class ModuleRefRow {
    nameIndex: number = 0;
    name: string = "";
}

export class TypeSpecRow {
    signatureIndex: number = 0;
    signatureData: DataView = NoData;
}

export class ImplMapRow {
    mappingFlags: number = 0;
    memberForwardedCI: number = 0;
    importNameIndex: number = 0;
    importName: string = "";
    importScopeIndex: number = 0;
}

export class FieldRvaRow {
    rva: number = 0;
    fieldIndex: number = 0;
}

export class AssemblyRow {
    hashAlgId: number = 0;
    majorVersion: number = 0;
    minorVersion: number = 0;
    buildNumber: number = 0;
    revisionNumber: number = 0;
    flags: number = 0;
    publicKeyIndex: number = 0;
    publicKeyData: DataView = NoData;
    nameIndex: number = 0;
    name: string = "";
    cultureIndex: number = 0;
    culture: string = "";
}

export class AssemblyProcessorRow {
    processor: number = 0;
}

export class AssemblyOsRow {
    osPlarformId: number = 0;
    osMajorVersion: number = 0;
    osMinorVersion: number = 0;
}

export class AssemblyRefRow {
    majorVersion: number = 0;
    minorVersion: number = 0;
    buildNumber: number = 0;
    revisionNumber: number = 0;
    flags: number = 0;
    publicKeyOrTokenIndex: number = 0;
    publicKeyOrTokenData: DataView = NoData;
    nameIndex: number = 0;
    name: string = "";
    cultureIndex: number = 0;
    culture: string = "";
    hashValueIndex: number = 0;
    hashValueData: DataView = NoData;
}

export class AssemblyRefProcessorRow {
    processor: number = 0;
    assemblyRefIndex: number = 0;
}

export class AssemblyRefOsRow {
    osPlarformId: number = 0;
    osMajorVersion: number = 0;
    osMinorVersion: number = 0;
    assemblyRefIndex: number = 0;
}

export class FileRow {
    flags: number = 0;
    nameIndex: number = 0;
    name: string = "";
    hashValueIndex: number = 0;
    hashValue: DataView = NoData;
}