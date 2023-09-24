import { BinaryHeap } from "src/BinaryHeap.js";
import { Column } from "./Column.js";

export class BlobReferenceColumn<TRow> implements Column<TRow> {
    private readonly blobHeapSize: number;
    private readonly readIndex: (view: DataView, offset: number) => number;
    private readonly setIndex: (row: TRow, index: number) => void;
    private readonly setData: (row: TRow, data: DataView) => void;
    private readonly blobHeap: Readonly<BinaryHeap>;

    constructor(
        blobHeap: Readonly<BinaryHeap>,
        setIndex: (row: TRow, index: number) => void,
        setData: (row: TRow, data: DataView) => void)
    {
        this.blobHeapSize = blobHeap.indexSizeBytes;
        this.blobHeap = blobHeap;
        this.setIndex = setIndex;
        this.setData = setData;
        this.readIndex = this.blobHeapSize == 2
            ? (view, offset) => view.getUint16(offset, true)
            : (view, offset) => view.getUint32(offset, true);
    }
    
    read(view: DataView, offset: number, row: TRow): number {
        const index = this.readIndex(view, offset);
        this.setIndex(row, index);
        const firstLengthByte = this.blobHeap.getBinaryData(index, 1).getUint8(0);
        if ((firstLengthByte & 0x80) == 0) {
            // single byte length
            const length = firstLengthByte & 0x7F;
            const data = this.blobHeap.getBinaryData(index + 1, length);
            this.setData(row, data);
        } else if ((firstLengthByte & 0xC0) == 0x80) {
            // two byte length
            const length = this.blobHeap.getBinaryData(index, 2).getUint16(0, false) & 0x3FFF; // big endian!!!
            const data = this.blobHeap.getBinaryData(index + 2, length);
            this.setData(row, data);
        } else if ((firstLengthByte & 0xE0) == 0xC0) {
            // four byte length
            const length = this.blobHeap.getBinaryData(index, 4).getUint32(0, false) & 0x1FFFFFFF; // here, too!!!
            const data = this.blobHeap.getBinaryData(index + 4, length);
            this.setData(row, data);
        }
        return this.blobHeapSize;
    }
}