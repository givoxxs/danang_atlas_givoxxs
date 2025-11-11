module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'DaNang Culinary Atlas API Test Report',
        outputPath: './reports/test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        theme: 'lightTheme',
        logo: '',
        dateFormat: 'yyyy-mm-dd HH:MM:ss'
      }
    ],
    '<rootDir>/tests/reporters/excel-reporter.js'
  ]
};
