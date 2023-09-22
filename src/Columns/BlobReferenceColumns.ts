import { Column } from "./Column.js";

export class BlobReferenceColumn<TRow> implements Column<TRow> {
    private readonly blobHeapSize: number;
    private readonly readIndex: (view: DataView, offset: number) => number;
    private readonly setIndex: (row: TRow, index: number) => void;

    // TODO: read blob data II.24.2.4
    constructor(blobHeapSize: number, setIndex: (row: TRow, index: number) => void) {
        this.blobHeapSize = blobHeapSize;
        this.setIndex = setIndex;
        this.readIndex = blobHeapSize == 2
            ? (view, offset) => view.getUint16(offset, true)
            : (view, offset) => view.getUint32(offset, true);
    }
    
    read(view: DataView, offset: number, row: TRow): number {
        const index = this.readIndex(view, offset);
        this.setIndex(row, index);

        return this.blobHeapSize;
    }
}