import { Column } from "./Column.js";

export class GuidReferenceColumn<TRow> implements Column<TRow> {
    private readonly guidHeapSize: number;
    private readonly readIndex: (view: DataView, offset: number) => number;
    private readonly setIndex: (row: TRow, index: number) => void;

    // TODO: read actual Guid from Guid heap
    constructor(guidHeapSize: number, setIndex: (row: TRow, index: number) => void) {
        this.guidHeapSize = guidHeapSize;
        this.setIndex = setIndex;
        this.readIndex = guidHeapSize == 2
            ? (view, offset) => view.getUint16(offset, true)
            : (view, offset) => view.getUint32(offset, true);
    }

    read(view: DataView, offset: number, row: TRow): number {
        const index = this.readIndex(view, offset);
        this.setIndex(row, index);

        return this.guidHeapSize;
    }
    
}