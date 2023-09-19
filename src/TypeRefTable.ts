import { StringHeap } from "./StringHeap.js";
import { CliMetadataTableStreamHeader, HeapSizes, MetadataTables } from "./Structures.js";

export interface TypeRefTableRow {
    resolutionScopeCI: number;
    typeNameIndex: number;
    typeName: string;
    typeNamespaceIndex: number;
    typeNamespace: string;
}

export interface TypeRefTableReadResult {
    table: TypeRefTable,
    bytesRead: number,
}

export class TypeRefTable {
    rows: TypeRefTableRow[];

    constructor(rows: TypeRefTableRow[]) {
        this.rows = rows;
    }

    public static fromBytes(
        original: DataView,
        tableOffset: number,
        tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
        stringHeap: Readonly<StringHeap>): Readonly<TypeRefTableReadResult> | null
    {
        if (!tableStreamHeader.presentTables[MetadataTables.TypeRef] || tableStreamHeader.tableRowCounts[MetadataTables.TypeRef] <= 0) {
            return null;
        }

        const view = new DataView(original.buffer, original.byteOffset + tableOffset);

        let offset = 0;
        let rows: TypeRefTableRow[] = [];
        for (let i = 0; i < tableStreamHeader.tableRowCounts[MetadataTables.TypeRef]; ++i) {
            const rowResult = getTypeRefTableRow(view, offset, tableStreamHeader, stringHeap);
            rows.push(rowResult.TypeRefTableRow);
            offset += rowResult.bytesRead;
        }
        return {
            table: new TypeRefTable(rows),
            bytesRead: offset,
        }
    }
}

enum ResolutionScope {
    Module = 0,
    ModuleRef = 1,
    AssemblyRef = 2,
    TypeRef = 3,
}

interface TypeRefTableRowReadResult {
    TypeRefTableRow: TypeRefTableRow;
    bytesRead: number;
}

function getTypeRefTableRow(
    view: DataView,
    offset: number,
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>): TypeRefTableRowReadResult
{
    const maxRows = Math.max(
        tableStreamHeader.tableRowCounts[MetadataTables.Module],
        tableStreamHeader.tableRowCounts[MetadataTables.ModuleRef],
        tableStreamHeader.tableRowCounts[MetadataTables.AssemblyRef],
        tableStreamHeader.tableRowCounts[MetadataTables.TypeRef]);
    const resolutionScopeIndexSize = maxRows < (1 << (16 - 2)) ? 2 : 4;
    const stringHeapIndexSize = tableStreamHeader.heapSizes & HeapSizes.StringStreamUses32BitIndexes ? 4 : 2;
    const getStringHeapIndex = stringHeapIndexSize === 4 ? view.getUint32.bind(view) : view.getUint16.bind(view);

    const resolutionScopeCI = resolutionScopeIndexSize == 2 ? view.getUint16(offset, true) : view.getUint32(offset, true);
    const tableTag = resolutionScopeCI & 0b11;
    const tableIndex = resolutionScopeCI >> 2;
    // TODO: consume tableTag and tableIndex
    const row: TypeRefTableRow = {
        resolutionScopeCI: resolutionScopeCI,
        typeNameIndex: getStringHeapIndex(offset + resolutionScopeIndexSize, true),
        typeName: "",
        typeNamespaceIndex: getStringHeapIndex(offset + resolutionScopeIndexSize + stringHeapIndexSize, true),
        typeNamespace: "",
    };
    row.typeName = stringHeap.getString(row.typeNameIndex);
    row.typeNamespace = stringHeap.getString(row.typeNamespaceIndex);

    return {
        TypeRefTableRow: row,
        bytesRead: resolutionScopeIndexSize + stringHeapIndexSize * 2
    }
}