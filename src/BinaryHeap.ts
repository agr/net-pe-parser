import { HeapBase } from "./HeapBase.js";

export class BinaryHeap extends HeapBase {
    constructor(heapData: DataView) {
        super(heapData);
    }

    public getBinaryData(offset: number, length: number): DataView {
        return new DataView(this.heapData.buffer, this.heapData.byteOffset + offset, length);
    }
}