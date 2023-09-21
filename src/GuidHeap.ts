import { HeapBase } from "./HeapBase.js";

export class GuidHeap extends HeapBase {
    constructor(heapData: DataView, indexSizeBytes: number) {
        super(heapData, indexSizeBytes);
    }

    public getGuid(offset: number): string {
        throw new Error("Not implemented :(");
    }
}