"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    clearMocks: true,
    moduleFileExtensions: ['js', 'ts'],
    testEnvironment: 'node',
    testMatch: ['**/__tests__/*.test.ts'],
    testRunner: 'jest-circus/runner',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    reporters: ['default', 'jest-junit'],
    verbose: true,
    testPathIgnorePatterns: ['/helpers/', '/node_modules/'],
    coveragePathIgnorePatterns: ['/node_modules/'],
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map