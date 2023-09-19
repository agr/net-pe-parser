import { HeapBase } from "./HeapBase.js";
import { getNullTerminatedUtf8String } from "./Helpers.js";

export class StringHeap extends HeapBase {
    constructor(heapData: DataView) {
        super(heapData);
    }

    public getString(offset: number): string {
        return getNullTerminatedUtf8String(this.heapData, offset).string;
    }
}