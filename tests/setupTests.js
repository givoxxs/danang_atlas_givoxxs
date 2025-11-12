// Load .env for tests
try {
  require('dotenv').config();
} catch (e) {
  // dotenv may not be installed in some contexts
}

// Setup tokens before running tests
const { setupTokens, loadTokens } = require('./setup-tokens');

// This runs once before all tests
beforeAll(async () => {
  console.log('\n🔧 Initializing test environment...');
  
  // Update tokens from API
  try {
    await setupTokens();
  } catch (error) {
    console.log('⚠️  Using existing tokens from variable.json');
  }
  
  // Load tokens into environment for requestRunner
  const tokens = loadTokens();
  process.env.EXPIRED_TOKEN = tokens.EXPIRED_TOKEN;
  process.env.VALID_TOKEN = tokens.VALID_TOKEN;
  
  // Clear test execution data
  const { clearTestExecutionData } = require('./helpers/requestRunner');
  clearTestExecutionData();
  console.log('✅ Ready to run tests\n');
});

// Global Jest setup
jest.setTimeout(10000);
