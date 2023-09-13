import {describe, expect, test} from '@jest/globals';

describe('Test module', () => {
    test('sanity', () => {
        expect(42).toBe(42);
    });
});