import { StringHeap } from "./StringHeap.js";
import { CliMetadataTableStreamHeader, HeapSizes, MetadataTables } from "./Structures.js";

export interface ModuleTableRow {
    generation: number;
    nameIndex: number;
    name: string;
    mvidIndex: number;
    encIdIndex: number;
    encBaseIdIndex: number;
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
        if (!tableStreamHeader.presentTables[MetadataTables.Module] || tableStreamHeader.tableRowCounts[0] <= 0) {
            return null;
        }

        const view = new DataView(original.buffer, original.byteOffset + tableOffset);
        const stringHeapIndexSize = tableStreamHeader.heapSizes & HeapSizes.StringStreamUses32BitIndexes ? 4 : 2;
        const getStringHeapIndex = stringHeapIndexSize === 4 ? view.getUint32.bind(view) : view.getUint16.bind(view);
        const guidHeapIndexSize = tableStreamHeader.heapSizes & HeapSizes.GuidStreamUses32BitIndexes ? 4 : 2;
        const getGuidHeapIndex = guidHeapIndexSize === 4 ? view.getUint32.bind(view) : view.getUint16.bind(view);
        let offset = 0;
        let rows: ModuleTableRow[] = [];
        for (let i = 0; i < tableStreamHeader.tableRowCounts[0]; ++i) {
            const generation = view.getUint16(offset, true);
            const nameIndex = getStringHeapIndex(offset + 2, true);
            const mvidIndex = getGuidHeapIndex(offset + 2 + stringHeapIndexSize, true);
            const encIdIndex = getGuidHeapIndex(offset + 2 + stringHeapIndexSize + guidHeapIndexSize, true);
            const encBaseIdIndex = getGuidHeapIndex(offset + 2 + stringHeapIndexSize + guidHeapIndexSize * 2, true);
            rows.push({
                generation: generation,
                nameIndex: nameIndex,
                name: stringHeap.getString(nameIndex),
                mvidIndex: mvidIndex,
                encIdIndex: encIdIndex,
                encBaseIdIndex: encBaseIdIndex,
            });
            offset += 2 + stringHeapIndexSize + guidHeapIndexSize * 3;
        }

        return {
            table: new ModuleTable(rows),
            bytesRead: offset,
        };
    }
}