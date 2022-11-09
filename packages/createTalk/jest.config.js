const config = {
  preset: 'ts-jest',
  verbose: true,
  rootDir: 'src',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['<rootDir>/*.specs.ts'],
  coverageDirectory: '../coverage',
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
  collectCoverage: true,
  reporters: ['default', 'jest-junit'],
};

module.exports = config;
