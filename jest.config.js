module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],

  maxWorkers: '50%',
  testTimeout: 10000,
  
  reporters: [
    'default',
    '<rootDir>/tests/reporters/excel-reporter.js'
  ]
};
