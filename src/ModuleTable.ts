import { Column } from "./Columns/Column.js";
import { GuidReferenceColumn } from "./Columns/GuidReferenceColumn.js";
import { StringHeap } from "./StringHeap.js";
import { StringReferenceColumn } from "./Columns/StringReferenceColumn.js";
import { CliMetadataTableStreamHeader, HeapSizes, MetadataTables } from "./Structures.js";
import { UintColumn } from "./Columns/UintColumn.js";

export class ModuleTableRow {
    generation: number = 0;
    nameIndex: number = 0;
    name: string = "";
    mvidIndex: number = 0;
    encIdIndex: number = 0;
    encBaseIdIndex: number = 0;
}

export interface ModuleTableReadResult {
    table: ModuleTable;
    bytesRead: number;
}

export class ModuleTable {
    public rows: ModuleTableRow[];

    constructor(rows: ModuleTableRow[]) {
        this.rows = rows;
    }

    public static fromBytes(
        original: DataView,
        tableOffset: number,
        tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
        stringHeap: Readonly<StringHeap>): Readonly<ModuleTableReadResult> | null
    {
        if (!tableStreamHeader.presentTables[MetadataTables.Module] || tableStreamHeader.tableRowCounts[MetadataTables.Module] <= 0) {
            return null;
        }

        const view = new DataView(original.buffer, original.byteOffset + tableOffset);

        const stringHeapIndexSize = tableStreamHeader.heapSizes & HeapSizes.StringStreamUses32BitIndexes ? 4 : 2;
        const guidHeapIndexSize = tableStreamHeader.heapSizes & HeapSizes.GuidStreamUses32BitIndexes ? 4 : 2;

        const columns: Column<ModuleTableRow>[] = [
            new UintColumn<ModuleTableRow>(2, (row, value) => row.generation = value),
            new StringReferenceColumn<ModuleTableRow>(
                stringHeap,
                stringHeapIndexSize,
                (row, index) => row.nameIndex = index,
                (row, value) => row.name = value),
            new GuidReferenceColumn<ModuleTableRow>(guidHeapIndexSize, (row, value) => row.mvidIndex = value),
            new GuidReferenceColumn<ModuleTableRow>(guidHeapIndexSize, (row, value) => row.encIdIndex = value),
            new GuidReferenceColumn<ModuleTableRow>(guidHeapIndexSize, (row, value) => row.encBaseIdIndex = value),
        ];

        let offset = 0;
        let rows: ModuleTableRow[] = [];
        for (let i = 0; i < tableStreamHeader.tableRowCounts[MetadataTables.Module]; ++i) {
            let row = new ModuleTableRow();

            for (const column of columns) {
                offset += column.read(view, offset, row);
            }

            rows.push(row);
        }

        return {
            table: new ModuleTable(rows),
            bytesRead: offset,
        };
    }
}