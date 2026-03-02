/** @type {import('jest').Config} */
module.exports = {
  displayName: 'integration',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/integration/.*\\.integration-spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage/integration',
  testEnvironment: 'node',
  testTimeout: 60000,
  // Run serially — each test needs a clean DB state
  runInBand: true,
};
