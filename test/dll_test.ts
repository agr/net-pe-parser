import {describe, expect, test, beforeAll} from '@jest/globals';
import * as fs from 'fs';
import * as child_process from 'child_process';
import { CliFile } from 'src/CliFile.js';
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
        const cliFile = new CliFile(data);
        const header = cliFile.getCliHeader();
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
        const cliFile = new CliFile(data);
        const mr = cliFile.getCliMetadataRoot();
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
        const cliFile = new CliFile(data);
        const tableStreamHeader = cliFile.getCliMetadataTableStreamHeader();
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
        const cliFile = new CliFile(data);
        const tables = cliFile.getCliMetadata();
        expect(tables).not.toBeNull();
        if (!tables) { throw ''; }
        expect(tables.module).not.toBeNull();
        if (!tables.module) { throw ''; }
        expect(tables.module.length).toBe(1);
        expect(tables.module[0].generation).toBe(0);
        expect(tables.module[0].name).toBe('dotnet-test.dll');
        expect(tables.typeRef).not.toBeNull();
        if (!tables.typeRef) { throw ''; }
        expect(tables.typeDef).not.toBeNull();
        if (!tables.typeDef) { throw ''; }
        expect(tables.typeDef.map(r => r.typeName)).toContain("Class1");
        expect(tables.typeDef.map(r => r.typeName)).toContain("Class2");
        expect(tables.typeDef.map(r => r.typeName)).toContain("NestedClass");
        expect(tables.field).not.toBeNull();
        if (!tables.field) { throw ''; }
        expect(tables.methodDef).not.toBeNull();
        if (!tables.methodDef) { throw ''; }
        expect(tables.methodDef.map(r => r.name)).toContain("TestFn");
        expect(tables.methodDef.map(r => r.name)).toContain("AnotherFn");
        expect(tables.methodDef.map(r => r.name)).toContain("NestedClassMethod");
        expect(tables.param).not.toBeNull();
        if (!tables.param) { throw ''; }
        expect(tables.param.map(r => r.name)).toContain("arg1");
        expect(tables.param.map(r => r.name)).toContain("arg2");
        expect(tables.param.map(r => r.name)).toContain("someObject");
        expect(tables.interfaceImpl).not.toBeNull();
        if (!tables.interfaceImpl) { throw ''; }
        expect(tables.interfaceImpl.length).toBeGreaterThan(0);
        expect(tables.interfaceImpl.map(r => tables.typeDef![r.classIndex - 1].typeName)).toContain("NestedClass");
        expect(tables.memberRef).not.toBeNull();
        if (!tables.memberRef) { throw ''; }
        expect(tables.memberRef.map(r => r.name)).toContain("Substring");
        expect(tables.memberRef.map(r => r.name)).toContain("get_Length");
        expect(tables.constant).not.toBeNull();
        if (!tables.constant) { throw ''; }
        expect(tables.constant.filter(r => r.type == ElementType.CLASS).length).toBeGreaterThan(0);
        expect(tables.constant.filter(r => r.type == ElementType.CLASS).map(r => r.value.getUint32(0, true) == 0).reduce((p: boolean, v: boolean) => p && v, true)).toBeTruthy();
        expect(tables.classLayout).not.toBeNull();
        if (!tables.classLayout) { throw ''; }
        expect(tables.classLayout.length).toBeGreaterThan(0);
        expect(tables.fieldLayout).not.toBeNull();
        if (!tables.fieldLayout) { throw ''; }
        expect(tables.fieldLayout.length).toBeGreaterThan(1);
        expect(tables.eventMap).not.toBeNull();
        if (!tables.eventMap) { throw ''; }
        expect(tables.eventMap.length).toBeGreaterThan(0);
        expect(tables.event).not.toBeNull();
        if (!tables.event) { throw ''; }
        expect(tables.event.map(r => r.name)).toContain("OnEvent");
        expect(tables.propertyMap).not.toBeNull();
        if (!tables.propertyMap) { throw ''; }
        expect(tables.propertyMap.length).toBeGreaterThan(0);
        expect(tables.property).not.toBeNull();
        if (!tables.property) { throw ''; }
        expect(tables.property.map(r => r.name)).toContain("SomeProperty");
        expect(tables.property.map(r => r.name)).toContain("StaticIntProperty");
        expect(tables.property.map(r => r.name)).toContain("StringProperty");
        expect(tables.methodSemantics).not.toBeNull();
        if (!tables.methodSemantics) { throw ''; }
        expect(tables.methodSemantics.length).toBeGreaterThan(0);
        expect(tables.methodImpl).not.toBeNull();
        if (!tables.methodImpl) { throw ''; }
        expect(tables.methodImpl.length).toBeGreaterThan(0);
        expect(tables.implMap).not.toBeNull();
        if (!tables.implMap) { throw ''; }
        expect(tables.implMap.length).toBeGreaterThan(0);
        expect(tables.assembly).not.toBeNull();
        if (!tables.assembly) { throw ''; }
        expect(tables.assembly.length).toBe(1);
        expect(tables.assembly[0].name).toBe('dotnet-test');
        expect(tables.assemblyRef).not.toBeNull();
        if (!tables.assemblyRef) { throw ''; }
        expect(tables.assemblyRef.map(r => r.name)).toContain("System.Runtime");
        expect(tables.nestedClass).not.toBeNull();
        if (!tables.nestedClass) { throw ''; }
        expect(tables.nestedClass.length).toBeGreaterThan(0);
        expect(tables.nestedClass.map(r => tables.typeDef![r.nestedClassIndex - 1].typeName)).toContain("NestedClass");
        expect(tables.nestedClass.map(r => tables.typeDef![r.enclosingClassIndex - 1].typeName)).toContain("Class2");
        expect(tables.genericParam).not.toBeNull();
        if (!tables.genericParam) { throw ''; }
        expect(tables.genericParam.length).toBeGreaterThan(0);
        expect(tables.genericParam.map(r => r.name)).toContain("GenericParam1");
        expect(tables.genericParam.map(r => r.name)).toContain("GenericParam2");
        expect(tables.methodSpec).not.toBeNull();
        if (!tables.methodSpec) { throw '';}
        expect(tables.methodSpec.length).toBeGreaterThan(0);
        expect(tables.genericParamConstraint).not.toBeNull();
        if (!tables.genericParamConstraint) { throw '';}
        expect(tables.genericParamConstraint.length).toBeGreaterThan(0);
        expect(tables.genericParamConstraint.map(r => tables.genericParam![r.ownerIndex - 1].name)).toContain("GenericParam1");
    });

    test("Type fields and methods are set up correctly", () => {
        const data = fs.readFileSync(dllPath);
        const cliFile = new CliFile(data);
        const tables = cliFile.getCliMetadata();
        if (!tables || !tables.typeDef) { throw ''; }

        const class1 = tables.typeDef.find(r => r.typeName === "Class1");
        expect(class1).toBeDefined();
        if (!class1) { throw ''; }
        expect(class1.fieldList.map(r => r.name)).toContain("Constant1");
        expect(class1.fieldList.map(r => r.name)).toContain("StringConst");
        expect(class1.fieldList.map(r => r.name)).toContain("ClassConst");
        expect(class1.fieldList.map(r => r.name)).toContain("OnEvent");

        expect(class1.methodList.map(r => r.name)).toContain("GetDC");
        expect(class1.methodList.map(r => r.name)).toContain("TestFn");
        expect(class1.methodList.map(r => r.name)).toContain(".ctor");

        const class2 = tables.typeDef.find(r => r.typeName === "Class2");
        expect(class2).toBeDefined();
        if (!class2) { throw ''; }

        // backing fields for class properties
        expect(class2.fieldList.map(r => r.name).find(r => r.indexOf("StaticIntProperty") >= 0)).toBeDefined();
        expect(class2.fieldList.map(r => r.name).find(r => r.indexOf("StringProperty") >= 0)).toBeDefined();

        expect(class2.methodList.map(r => r.name)).toContain("AnotherFn");
        expect(class2.methodList.map(r => r.name)).toContain(".ctor");

        const nestedClass = tables.typeDef.find(r => r.typeName === "NestedClass");
        expect(nestedClass).toBeDefined();
        if (!nestedClass) { throw ''; }

        expect(nestedClass.fieldList.length).toBe(0);

        expect(nestedClass.methodList.map(r => r.name)).toContain("NestedClassMethod");
        expect(nestedClass.methodList.map(r => r.name)).toContain("SomeMethod");
        expect(nestedClass.methodList.map(r => r.name)).toContain(".ctor");
    });
});