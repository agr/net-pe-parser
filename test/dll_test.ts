import {describe, expect, test} from '@jest/globals';
//import * as PE from 'pe-library';
import * as fs from 'fs';

describe('DLL file module', () => {
    test('File reads', () => {
        const data = fs.readFileSync('../dotnet-test/bin/Debug/net7.0/dotnet-test.dll');
        expect(data.length).toBe(4608);
    });

    // test('PE reads', () => {
    //     const data = fs.readFileSync('../dotnet-test/bin/Debug/net7.0/dotnet-test.dll');
    //     const exe = PE.NtExecutable.from(data);
    //     const sections = exe.getAllSections();
    //     expect(sections.length).toBeGreaterThan(0);
    // });
});