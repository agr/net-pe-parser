import { HeapBase } from "./HeapBase.js";
import { getNullTerminatedUtf8String } from "./Helpers.js";

export class StringHeap extends HeapBase {
    constructor(heapData: DataView, indexSizeBytes: number) {
        super(heapData, indexSizeBytes);
    }

    public getString(offset: number): string {
        return getNullTerminatedUtf8String(this.heapData, offset).string;
    }
}