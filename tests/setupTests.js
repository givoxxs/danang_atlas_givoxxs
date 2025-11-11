// Load .env for tests
try {
  require('dotenv').config();
} catch (e) {
  // dotenv may not be installed in some contexts
}

// Clear test execution data before running tests
const { clearTestExecutionData } = require('./helpers/requestRunner');
clearTestExecutionData();
console.log('🧹 Test execution data cleared - Starting fresh test run\n');

// Global Jest setup for danang_atlas tests
// Example: increase default timeout and any global mocks
jest.setTimeout(10000);
