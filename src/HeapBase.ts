export class HeapBase {
    protected heapData: DataView;
    public readonly indexSizeBytes: number;

    constructor(heapData: DataView, indexSizeBytes: number) {
        this.heapData = heapData;
        this.indexSizeBytes = indexSizeBytes;
    }
}