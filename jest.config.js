/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/env.ts'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  testTimeout: 30000,
};
