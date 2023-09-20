import { CodedIndexColumn } from "./Columns/CodedIndexColumn.js";
import { Column } from "./Columns/Column.js";
import { StringReferenceColumn } from "./Columns/StringReferenceColumn.js";
import { UintColumn } from "./Columns/UintColumn.js";
import { StringHeap } from "./StringHeap.js";
import { CliMetadataTableStreamHeader, HeapSizes, MetadataTables } from "./Structures.js";
import * as CodedIndex from "./Columns/CodedIndex.js"
import { TableIndexColumn } from "./Columns/TableIndexColumn.js";

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

export interface TypeDefTableReadResult {
    table: TypeDefTable,
    bytesRead: number,
}

export class TypeDefTable {
    rows: TypeDefTableRow[];

    constructor(rows: TypeDefTableRow[]) {
        this.rows = rows;
    }

    public static fromBytes(
        original: DataView,
        tableOffset: number,
        tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
        stringHeap: Readonly<StringHeap>): Readonly<TypeDefTableReadResult> | null
    {
        if (!tableStreamHeader.presentTables[MetadataTables.TypeDef] || tableStreamHeader.tableRowCounts[MetadataTables.TypeDef] <= 0) {
            return null;
        }

        const view = new DataView(original.buffer, original.byteOffset + tableOffset);
        const stringHeapIndexSize = tableStreamHeader.heapSizes & HeapSizes.StringStreamUses32BitIndexes ? 4 : 2;

        let offset = 0;
        let rows: TypeDefTableRow[] = [];

        const columns: Column<TypeDefTableRow>[] = [
            new UintColumn(4, (row, value) => row.flags = value),
            new StringReferenceColumn(stringHeap, stringHeapIndexSize, (row, index) => row.typeNameIndex = index, (row, value) => row.typeName = value),
            new StringReferenceColumn(stringHeap, stringHeapIndexSize, (row, index) => row.typeNamespaceIndex = index, (row, value) => row.typeNamespace = value),
            new CodedIndexColumn(tableStreamHeader, CodedIndex.TypeDefOrRef, (row, index) => row.extendsCI = index),
            new TableIndexColumn(tableStreamHeader, MetadataTables.Field, (row, index) => row.fieldListIndex = index),
            new TableIndexColumn(tableStreamHeader, MetadataTables.MethodDef, (row, index) => row.methodListIndex = index),
        ];

        for (let i = 0; i < tableStreamHeader.tableRowCounts[MetadataTables.TypeDef]; ++i) {
            let row = new TypeDefTableRow();

            for (const column of columns) {
                offset += column.read(view, offset, row);
            }

            rows.push(row);
        }

        return {
            table: new TypeDefTable(rows),
            bytesRead: offset,
        }
    }
}