import { Column } from "./Column.js";

export class UintColumn<TRow> implements Column<TRow> {
    private size: number;
    private readValue: (view: DataView, offset: number) => number;
    private setValue: (row: TRow, value: number) => void;
    
    constructor(size: number, setValue: (row: TRow, value: number) => void) {
        this.size = size;
        this.setValue = setValue;
        if (size == 1) {
            this.readValue = (view, offset) => view.getUint8(offset);
        }
        else if (size == 2) {
            this.readValue = (view, offset) => view.getUint16(offset, true);
        }
        else if (size == 4) {
            this.readValue = (view, offset) => view.getUint32(offset, true);
        }
        else {
            throw new Error(`Unsupported column size: ${size}`);
        }
    }
    
    read(view: DataView, offset: number, row: TRow): number {
        const value = this.readValue(view, offset);
        this.setValue(row, value);
        return this.size;
    }
}