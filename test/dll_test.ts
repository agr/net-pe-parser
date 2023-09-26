import {describe, expect, test, beforeAll} from '@jest/globals';
import * as PE from 'pe-library';
import * as fs from 'fs';
import * as child_process from 'child_process';
import { CliParser } from 'src/main.js';
import { ElementType } from 'src/Structures.js';

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
        expect(tables.moduleTable.length).toBe(1);
        expect(tables.moduleTable[0].generation).toBe(0);
        expect(tables.moduleTable[0].name).toBe('dotnet-test.dll');
        expect(tables.typeRefTable).not.toBeNull();
        if (!tables.typeRefTable) { throw ''; }
        expect(tables.typeDefTable).not.toBeNull();
        if (!tables.typeDefTable) { throw ''; }
        expect(tables.typeDefTable.map(r => r.typeName)).toContain("Class1");
        expect(tables.typeDefTable.map(r => r.typeName)).toContain("Class2");
        expect(tables.typeDefTable.map(r => r.typeName)).toContain("NestedClass");
        expect(tables.fieldTable).not.toBeNull();
        if (!tables.fieldTable) { throw ''; }
        expect(tables.methodDefTable).not.toBeNull();
        if (!tables.methodDefTable) { throw ''; }
        expect(tables.methodDefTable.map(r => r.name)).toContain("TestFn");
        expect(tables.methodDefTable.map(r => r.name)).toContain("AnotherFn");
        expect(tables.methodDefTable.map(r => r.name)).toContain("NestedClassMethod");
        expect(tables.paramTable).not.toBeNull();
        if (!tables.paramTable) { throw ''; }
        expect(tables.paramTable.map(r => r.name)).toContain("arg1");
        expect(tables.paramTable.map(r => r.name)).toContain("arg2");
        expect(tables.paramTable.map(r => r.name)).toContain("someObject");
        expect(tables.interfaceImplTable).not.toBeNull();
        if (!tables.interfaceImplTable) { throw ''; }
        expect(tables.interfaceImplTable.length).toBeGreaterThan(0);
        expect(tables.interfaceImplTable.map(r => tables.typeDefTable![r.classIndex - 1].typeName)).toContain("NestedClass");
        expect(tables.memberRefTable).not.toBeNull();
        if (!tables.memberRefTable) { throw ''; }
        expect(tables.memberRefTable.map(r => r.name)).toContain("Substring");
        expect(tables.memberRefTable.map(r => r.name)).toContain("get_Length");
        expect(tables.constantTable).not.toBeNull();
        if (!tables.constantTable) { throw ''; }
        expect(tables.constantTable.filter(r => r.type == ElementType.CLASS).length).toBeGreaterThan(0);
        expect(tables.constantTable.filter(r => r.type == ElementType.CLASS).map(r => r.value.getUint32(0, true) == 0).reduce((p: boolean, v: boolean) => p && v, true)).toBeTruthy();
        expect(tables.classLayoutTable).not.toBeNull();
        if (!tables.classLayoutTable) { throw ''; }
        expect(tables.classLayoutTable.length).toBeGreaterThan(0);
        expect(tables.fieldLayoutTable).not.toBeNull();
        if (!tables.fieldLayoutTable) { throw ''; }
        expect(tables.fieldLayoutTable.length).toBeGreaterThan(1);
        expect(tables.eventMapTable).not.toBeNull();
        if (!tables.eventMapTable) { throw ''; }
        expect(tables.eventMapTable.length).toBeGreaterThan(0);
        expect(tables.eventTable).not.toBeNull();
        if (!tables.eventTable) { throw ''; }
        expect(tables.eventTable.map(r => r.name)).toContain("OnEvent");
        expect(tables.propertyMapTable).not.toBeNull();
        if (!tables.propertyMapTable) { throw ''; }
        expect(tables.propertyMapTable.length).toBeGreaterThan(0);
        expect(tables.propertyTable).not.toBeNull();
        if (!tables.propertyTable) { throw ''; }
        expect(tables.propertyTable.map(r => r.name)).toContain("SomeProperty");
        expect(tables.propertyTable.map(r => r.name)).toContain("StaticIntProperty");
        expect(tables.propertyTable.map(r => r.name)).toContain("StringProperty");
        expect(tables.methodSemanticsTable).not.toBeNull();
        if (!tables.methodSemanticsTable) { throw ''; }
        expect(tables.methodSemanticsTable.length).toBeGreaterThan(0);
    });
});