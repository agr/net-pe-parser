import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^src/(.*)\\.js$': '<rootDir>/src/$1',
  },
  testEnvironment: "node",
  preset: 'ts-jest/presets/js-with-ts-esm',
  testMatch: [
    "**/test/**/*.[tj]s"
  ],
};

export default config;
