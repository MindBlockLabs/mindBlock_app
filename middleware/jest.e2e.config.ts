/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.test.ts', '**/tests/e2e/**/*.spec.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage/e2e',
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@mindblock/middleware/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000, // E2E tests may take even longer
};
