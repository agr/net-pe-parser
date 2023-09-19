import {describe, expect, test, beforeAll} from '@jest/globals';
import * as PE from 'pe-library';
import * as fs from 'fs';
import * as child_process from 'child_process';
import { CliParser } from '../src/main.js';

const dllPath = './test/dotnet-test/bin/Debug/net7.0/dotnet-test.dll';

describe('DLL file parsing tests', () => {
    beforeAll(async () => {
        if (!fs.existsSync(dllPath)) {
            const process = child_process.execFile("dotnet.exe", ["build"], { cwd: "./test/dotnet-test/" });
            const promise = new Promise((resolve, reject) => {
                process.on('exit', () => resolve(process));
                process.on('error', (err) => reject(err));
            });
            await promise;
            expect(process.exitCode).toBe(0);
        }
    });
    
    test('CLI header parsing works', () => {
        const data = fs.readFileSync(dllPath);
        const exe = PE.NtExecutable.from(data);
        const header = CliParser.getCliHeader(exe);
        expect(header).not.toBeNull();
        expect(header?.cbSize).toBe(72);
        expect(header?.codeManagerTable.virtualAddress).toBe(0);
        expect(header?.codeManagerTable.size).toBe(0);
        expect(header?.exportAddressTableJumps.virtualAddress).toBe(0);
        expect(header?.exportAddressTableJumps.size).toBe(0);
        expect(header?.managedNativeHeader.virtualAddress).toBe(0);
        expect(header?.managedNativeHeader.size).toBe(0);
    });

    test('Metadata root parsing works', () => {
        const data = fs.readFileSync(dllPath);
        const exe = PE.NtExecutable.from(data);
        const header = CliParser.getCliHeader(exe);
        if (!header) {
            expect(header).not.toBeNull();
            throw '';
        }

        const mr = CliParser.getCliMetadataRoot(exe, header.metaData);
        expect(mr).not.toBeNull();
        expect(mr?.signature).toBe(0x424A5342);
        expect(mr?.reserved).toBe(0);
        expect(mr?.versionLength).toBeGreaterThan(0);
        expect(mr?.version).toBeTruthy();
        expect(mr?.flags).toBe(0);
        expect(mr?.streamCount).toBeGreaterThan(0);
        expect(mr?.streamHeaders.length).toBe(mr?.streamCount);
        mr?.streamHeaders.forEach(h => {
            expect(h.streamSize).toBeGreaterThan(0);
            expect(h.streamName).toBeTruthy();
            expect(h.metadataRootOffset).toBeLessThan(data.length);
        });
    });

    test('Metadata table stream header parsing works', () => {
        const data = fs.readFileSync(dllPath);
        const exe = PE.NtExecutable.from(data);
        const header = CliParser.getCliHeader(exe);
        expect(header).not.toBeNull();
        if (!header) { throw ''; }
        const mr = CliParser.getCliMetadataRoot(exe, header.metaData);
        expect(mr).not.toBeNull();
        if (!mr) { throw ''; }
        const tableStreamHeader = CliParser.getCliMetadataTableStreamHeader(exe, header.metaData, mr);
        expect(tableStreamHeader).not.toBeNull();
        if (!tableStreamHeader) { throw ''; }
        expect(tableStreamHeader.reserved).toBe(0);  // 24.2.6
        expect(tableStreamHeader.majorVersion).toBe(2);
        expect(tableStreamHeader.minorVersion).toBe(0);
        expect(tableStreamHeader.heapSizes & 0xF8).toBe(0);
        expect(tableStreamHeader.reserved2).toBe(1);
        expect(tableStreamHeader.presentTables.length).toBe(64);
        expect(tableStreamHeader.sortedTables.length).toBe(64);

        expect(tableStreamHeader.presentTables.length).toBe(tableStreamHeader.tableRowCounts.length);
        for (let i = 0; i < tableStreamHeader.presentTables.length; ++i) {
            if (tableStreamHeader.presentTables[i]) {
                expect(tableStreamHeader.tableRowCounts[i]).toBeGreaterThan(0);
                expect(tableStreamHeader.tableRowCounts[i]).toBeLessThan(1000); // the test assembly is rather small, so all the present tables should be small as well
            }
            else {
                expect(tableStreamHeader.tableRowCounts[i]).toBe(0);
            }
        }
        expect(tableStreamHeader.presentTables.slice(0x2D).filter(t => t).length).toBe(0);
    });

    test('Metadata tables parsing works', () => {
        const data = fs.readFileSync(dllPath);
        const exe = PE.NtExecutable.from(data);
        const header = CliParser.getCliHeader(exe);
        expect(header).not.toBeNull();
        if (!header) { throw ''; }
        const mr = CliParser.getCliMetadataRoot(exe, header.metaData);
        expect(mr).not.toBeNull();
        if (!mr) { throw ''; }
        const tables = CliParser.getCliMetadataTables(exe, header.metaData, mr);
        expect(tables).not.toBeNull();
        if (!tables) { throw ''; }
        expect(tables.moduleTable).not.toBeNull();
        if (!tables.moduleTable) { throw ''; }
        expect(tables.moduleTable.rows.length).toBe(1);
        expect(tables.moduleTable.rows[0].name).toBe('dotnet-test.dll');
        expect(tables.typeDefTable).not.toBeNull();
        if (!tables.typeDefTable) { throw ''; }
        expect(tables.typeDefTable.rows.map(r => r.typeName)).toContain("Class1");
        expect(tables.typeDefTable.rows.map(r => r.typeName)).toContain("Class2");
        expect(tables.typeDefTable.rows.map(r => r.typeName)).toContain("NestedClass");
    });
});