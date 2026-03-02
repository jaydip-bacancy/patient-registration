/** @type {import('jest').Config} */
module.exports = {
  displayName: 'unit',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: [
    'main\\.ts',
    '\\.module\\.ts$',
    '\\.dto\\.ts$',
    '\\.interface\\.ts$',
    '\\.decorator\\.ts$',
    '\\.filter\\.ts$',
    '\\.interceptor\\.ts$',
    '\\.pipe\\.ts$',
    '\\.strategy\\.ts$',
    '\\.guard\\.ts$',
  ],
  coverageDirectory: '../coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'node',
};
