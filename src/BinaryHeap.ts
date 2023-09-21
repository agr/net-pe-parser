import { HeapBase } from "./HeapBase.js";

export class BinaryHeap extends HeapBase {
    constructor(heapData: DataView, indexSizeBytes: number) {
        super(heapData, indexSizeBytes);
    }

    public getBinaryData(offset: number, length: number): DataView {
        return new DataView(this.heapData.buffer, this.heapData.byteOffset + offset, length);
    }
}