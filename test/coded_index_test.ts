import {describe, expect, test} from '@jest/globals';
import { CodedIndexColumn } from 'src/Columns/CodedIndexColumn.js';
import * as CodedIndex from 'src/Columns/CodedIndex.js';
import { CliMetadataTableStreamHeader, MetadataTables } from 'src/Structures.js';

function makeHeader(rowCounts: Partial<Record<MetadataTables, number>>): CliMetadataTableStreamHeader {
    const tableRowCounts = new Array<number>(64).fill(0);
    const presentTables = new Array<boolean>(64).fill(false);
    for (const [table, count] of Object.entries(rowCounts)) {
        tableRowCounts[Number(table)] = count;
        presentTables[Number(table)] = count > 0;
    }
    return {
        reserved: 0,
        majorVersion: 2,
        minorVersion: 0,
        heapSizes: 0,
        reserved2: 1,
        presentTables: presentTables,
        sortedTables: new Array<boolean>(64).fill(false),
        tableRowCounts: tableRowCounts,
    };
}

/** Reads a single row and returns the number of bytes the column consumed. */
function columnSize(header: CliMetadataTableStreamHeader, tables: Array<MetadataTables>): number {
    const column = new CodedIndexColumn<{}>(header, tables, () => {});
    return column.read(new DataView(new ArrayBuffer(8)), 0, {});
}

describe('Coded index sizing', () => {
    test('small tables use 2-byte indexes', () => {
        const header = makeHeader({ [MetadataTables.MethodDef]: 10, [MetadataTables.MemberRef]: 5 });
        expect(columnSize(header, CodedIndex.MethodDefOrRef)).toBe(2);
        expect(columnSize(header, CodedIndex.HasCustomAttribute)).toBe(2);
    });

    test('unused tags do not break the size computation', () => {
        // HasCustomAttribute/CustomAttributeType contain fake tags with no row count in the header
        const header = makeHeader({ [MetadataTables.MethodDef]: 5000 });
        expect(columnSize(header, CodedIndex.HasCustomAttribute)).toBe(4);
        expect(columnSize(header, CodedIndex.CustomAttributeType)).toBe(2);
    });

    test('row counts at the size boundary use 4-byte indexes', () => {
        // MethodDefOrRef has 2 tags => 1 tag bit => at most 2^15 - 1 = 32767 rows
        expect(columnSize(makeHeader({ [MetadataTables.MethodDef]: 32767 }), CodedIndex.MethodDefOrRef)).toBe(2);
        expect(columnSize(makeHeader({ [MetadataTables.MethodDef]: 32768 }), CodedIndex.MethodDefOrRef)).toBe(4);

        // HasCustomAttribute has 22 tags => 5 tag bits => at most 2^11 - 1 = 2047 rows
        expect(columnSize(makeHeader({ [MetadataTables.TypeDef]: 2047 }), CodedIndex.HasCustomAttribute)).toBe(2);
        expect(columnSize(makeHeader({ [MetadataTables.TypeDef]: 2048 }), CodedIndex.HasCustomAttribute)).toBe(4);

        // TypeDefOrRef has 3 tags => 2 tag bits => at most 2^14 - 1 = 16383 rows
        expect(columnSize(makeHeader({ [MetadataTables.TypeSpec]: 16383 }), CodedIndex.TypeDefOrRef)).toBe(2);
        expect(columnSize(makeHeader({ [MetadataTables.TypeSpec]: 16384 }), CodedIndex.TypeDefOrRef)).toBe(4);
    });

    test('the largest referenced table determines the size', () => {
        const header = makeHeader({ [MetadataTables.Field]: 3, [MetadataTables.Param]: 100000 });
        expect(columnSize(header, CodedIndex.HasFieldMarshall)).toBe(4);
    });
});
