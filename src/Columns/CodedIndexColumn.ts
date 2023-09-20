import { CliMetadataTableStreamHeader, MetadataTables } from "src/Structures.js";
import { Column } from "./Column.js";

export class CodedIndexColumn<TRow> implements Column<TRow> {
    private indexSize: number;
    private tables: Array<MetadataTables>;
    private readCodedIndex: (view: DataView, offset: number) => number;
    private setCodedIndex: (row: TRow, index: number) => void;
    private getTag: (codedIndex: number) => number;
    private getTableIndex: (codedIndex: number) => number;

    constructor(
        tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
        tables: Array<MetadataTables>,
        setCodedIndex: (row: TRow, index: number) => void)
    {
        this.tables = tables;
        this.setCodedIndex = setCodedIndex;

        const tagBits = getMinBitsRepresenting(tables.length);
        const largestTableRows = Math.max(...tables.map(t => tableStreamHeader.tableRowCounts[t]));
        const tableIndexBits = getMinBitsRepresenting(largestTableRows);
        const totalBits = tagBits + tableIndexBits;
        this.indexSize = totalBits <= 16 ? 2 : 4;

        this.readCodedIndex = this.indexSize == 2
            ? (view, offset) => view.getUint16(offset, true)
            : (view, offset) => view.getUint32(offset, true);
        
        this.getTag = codedIndex => codedIndex & getLowerBitsMask(tagBits);
        this.getTableIndex = codedIndex => codedIndex >> tagBits;
    }
    
    read(view: DataView, offset: number, row: TRow): number {
        const codedIndex = this.readCodedIndex(view, offset);

        // TODO: use the 3 things below
        const tableTag = this.getTag(codedIndex);
        const table = this.tables[tableTag];
        const tableIndex = this.getTableIndex(codedIndex);

        this.setCodedIndex(row, codedIndex);

        return this.indexSize;
    }
}

function getMinBitsRepresenting(value: number): number {
    // 0 => 1   clz32(0) = 32
    // 1 => 1   clz32(1) = 31
    // 2 => 1   clz32(2) = 30
    // 3 => 2   clz32(3) = 30
    // 4 => 2   clz32(4) = 29
    // 5 => 3   clz32(5) = 29
    // ...
    // 8 => 3   clz32(8) = 28
    // 9 => 4   clz32(9) = 28
    // ...
    // 16 => 4  clz32(16) = 27
    if (value <= 1) {
        return 1;
    }
    return 32 - Math.clz32(value - 1);
}

function getLowerBitsMask(numBits: number): number {
    // 0 => 0
    // 1 => 0x01
    // 2 => 0x03
    // 3 => 0x07
    // 4 => 0x0F
    // 5 => 0x1F
    // ...
    return (1 << numBits) - 1;
}