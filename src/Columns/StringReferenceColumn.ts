import { Column } from "./Column.js";
import { StringHeap } from "../StringHeap.js";

export class StringReferenceColumn<TRow> implements Column<TRow> {
    private readonly stringHeap: Readonly<StringHeap>;
    private readonly readIndex: (view: DataView, offset: number) => number;
    private readonly setIndex: (row: TRow, index: number) => void;
    private readonly setString: (row: TRow, value: string) => void;

    constructor(
        stringHeap: Readonly<StringHeap>,
        setIndex: (row: TRow, index: number) => void,
        setString: (row: TRow, value: string) => void)
    {
        this.stringHeap = stringHeap;
        this.readIndex = stringHeap.indexSizeBytes == 2
            ? (view, offset) => view.getUint16(offset, true)
            : (view, offset) => view.getUint32(offset, true);
        this.setIndex = setIndex;
        this.setString = setString;
    }

    read(view: DataView, offset: number, row: TRow): number {
        const index = this.readIndex(view, offset);
        this.setIndex(row, index);
        const value = this.stringHeap.getString(index);
        this.setString(row, value);
        return this.stringHeap.indexSizeBytes;
    }

}