export class HeapBase {
    protected heapData: DataView;

    constructor(heapData: DataView) {
        this.heapData = heapData;
    }
}