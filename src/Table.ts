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