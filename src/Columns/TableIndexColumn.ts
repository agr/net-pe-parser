import { CliMetadataTableStreamHeader, MetadataTables } from "src/Structures.js";
import { Column } from "./Column.js";

export class TableIndexColumn<TRow> implements Column<TRow> {
    private indexSize: number;
    private table: MetadataTables;
    private readIndex: (view: DataView, offset: number) => number;
    private setIndex: (row: TRow, index: number) => void;

    constructor(
        tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
        table: MetadataTables,
        setIndex: (row: TRow, index: number) => void)
    {
        this.indexSize = tableStreamHeader.tableRowCounts[table] < 65536 ? 2 : 4;
        this.table = table;
        this.setIndex = setIndex;

        this.readIndex = this.indexSize == 2
            ? (view, offset) => view.getUint16(offset, true)
            : (view, offset) => view.getUint32(offset, true);
    }


    read(view: DataView, offset: number, row: TRow): number {
        const index = this.readIndex(view, offset);
        this.setIndex(row, index);

        return this.indexSize;
    }
}