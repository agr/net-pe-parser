
export interface Column<TRow> {
    read(view: DataView, offset: number, row: TRow): number;
}
