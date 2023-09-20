import { CodedIndexColumn } from "./Columns/CodedIndexColumn.js";
import { Column } from "./Columns/Column.js";
import { StringHeap } from "./StringHeap.js";
import { CliMetadataTableStreamHeader, HeapSizes, MetadataTables } from "./Structures.js";
import * as CodedIndex from "./Columns/CodedIndex.js"
import { StringReferenceColumn } from "./Columns/StringReferenceColumn.js";

export class TypeRefTableRow {
    resolutionScopeCI: number = 0;
    typeNameIndex: number = 0;
    typeName: string = "";
    typeNamespaceIndex: number = 0;
    typeNamespace: string = "";
}

export interface TypeRefTableReadResult {
    table: TypeRefTable,
    bytesRead: number,
}

export class TypeRefTable {
    rows: TypeRefTableRow[];

    constructor(rows: TypeRefTableRow[]) {
        this.rows = rows;
    }

    public static fromBytes(
        original: DataView,
        tableOffset: number,
        tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
        stringHeap: Readonly<StringHeap>): Readonly<TypeRefTableReadResult> | null
    {
        if (!tableStreamHeader.presentTables[MetadataTables.TypeRef] || tableStreamHeader.tableRowCounts[MetadataTables.TypeRef] <= 0) {
            return null;
        }

        const view = new DataView(original.buffer, original.byteOffset + tableOffset);
        const stringHeapIndexSize = tableStreamHeader.heapSizes & HeapSizes.StringStreamUses32BitIndexes ? 4 : 2;

        let offset = 0;
        let rows: TypeRefTableRow[] = [];

        const columns: Column<TypeRefTableRow>[] = [
            new CodedIndexColumn(tableStreamHeader, CodedIndex.ResolutionScope, (row, index) => row.resolutionScopeCI = index),
            new StringReferenceColumn(stringHeap, stringHeapIndexSize, (row, index) => row.typeNameIndex = index, (row, value) => row.typeName = value),
            new StringReferenceColumn(stringHeap, stringHeapIndexSize, (row, index) => row.typeNamespaceIndex = index, (row, value) => row.typeNamespace = value),
        ];

        for (let i = 0; i < tableStreamHeader.tableRowCounts[MetadataTables.TypeRef]; ++i) {
            let row = new TypeRefTableRow();

            for (const column of columns) {
                offset += column.read(view, offset, row);
            }

            rows.push(row);
        }

        return {
            table: new TypeRefTable(rows),
            bytesRead: offset,
        }
    }
}
