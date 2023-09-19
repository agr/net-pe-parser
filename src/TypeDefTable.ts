import { StringHeap } from "./StringHeap.js";
import { CliMetadataTableStreamHeader, HeapSizes, MetadataTables } from "./Structures.js";

export interface TypeDefTableRow {
    flags: number;
    typeNameIndex: number;
    typeName: string;
    typeNamespaceIndex: number;
    typeNamespace: string;
    extendsCI: number;
    fieldListIndex: number;
    methodListIndex: number;
}

export interface TypeDefTableReadResult {
    table: TypeDefTable,
    bytesRead: number,
}

export class TypeDefTable {
    rows: TypeDefTableRow[];

    constructor(rows: TypeDefTableRow[]) {
        this.rows = rows;
    }

    public static fromBytes(
        original: DataView,
        tableOffset: number,
        tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
        stringHeap: Readonly<StringHeap>): Readonly<TypeDefTableReadResult> | null
    {
        if (!tableStreamHeader.presentTables[MetadataTables.TypeDef] || tableStreamHeader.tableRowCounts[MetadataTables.TypeDef] <= 0) {
            return null;
        }

        const view = new DataView(original.buffer, original.byteOffset + tableOffset);
        let offset = 0;
        let rows: TypeDefTableRow[] = [];
        for (let i = 0; i < tableStreamHeader.tableRowCounts[MetadataTables.TypeDef]; ++i) {
            const rowResult = getTypeDefTableRow(view, offset, tableStreamHeader, stringHeap);
            rows.push(rowResult.TypeDefTableRow);
            offset += rowResult.bytesRead;
        }
        return {
            table: new TypeDefTable(rows),
            bytesRead: offset,
        }
    }
}


interface TypeDefTableRowReadResult {
    TypeDefTableRow: TypeDefTableRow;
    bytesRead: number;
}

function getTypeDefTableRow(
    view: DataView,
    offset: number,
    tableStreamHeader: Readonly<CliMetadataTableStreamHeader>,
    stringHeap: Readonly<StringHeap>): TypeDefTableRowReadResult
{
    const maxRows = Math.max(
        tableStreamHeader.tableRowCounts[MetadataTables.TypeDef],
        tableStreamHeader.tableRowCounts[MetadataTables.TypeRef],
        tableStreamHeader.tableRowCounts[MetadataTables.TypeSpec]);
    const extendsIndexSize = maxRows < (1 << (16 - 2)) ? 2 : 4;

    const stringHeapIndexSize = tableStreamHeader.heapSizes & HeapSizes.StringStreamUses32BitIndexes ? 4 : 2;
    const getStringHeapIndex = stringHeapIndexSize === 4 ? view.getUint32.bind(view) : view.getUint16.bind(view);

    const fieldListIndexSize = tableStreamHeader.tableRowCounts[MetadataTables.Field] < (1 << 16) ? 2 : 4;
    const methodListIndexSize = tableStreamHeader.tableRowCounts[MetadataTables.MethodDef] < (1 << 16) ? 2 : 4;

    const getFieldListIndex = fieldListIndexSize == 2 ? view.getUint16.bind(view) : view.getUint32.bind(view);
    const getMethodListIndex = methodListIndexSize == 2 ? view.getUint16.bind(view) : view.getUint32.bind(view);

    const row: TypeDefTableRow = {
        flags: view.getUint32(offset, true),
        typeNameIndex: getStringHeapIndex(offset + 4, true),
        typeName: "",
        typeNamespaceIndex: getStringHeapIndex(offset + 4 + stringHeapIndexSize, true),
        typeNamespace: "",
        extendsCI: extendsIndexSize == 2 ? view.getUint16(offset + 4 + stringHeapIndexSize * 2, true) : view.getUint32(offset + 4 + stringHeapIndexSize * 2, true),
        fieldListIndex: getFieldListIndex(offset + 4 + stringHeapIndexSize * 2 + extendsIndexSize, true),
        methodListIndex: getMethodListIndex(offset + 4 + stringHeapIndexSize * 2 + extendsIndexSize + fieldListIndexSize, true),
    };

    row.typeName = stringHeap.getString(row.typeNameIndex);
    row.typeNamespace = stringHeap.getString(row.typeNamespaceIndex);

    return {
        TypeDefTableRow: row,
        bytesRead: 4 + stringHeapIndexSize * 2 + extendsIndexSize + fieldListIndexSize + methodListIndexSize,
    };
}