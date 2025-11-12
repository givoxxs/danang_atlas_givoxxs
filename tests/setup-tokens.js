/**
 * Token Setup for Testing
 * Compact function to update tokens before running tests
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get fetch function
function getFetch() {
  if (typeof fetch === 'function') return fetch;
  try {
    const nf = require('node-fetch');
    return nf && (nf.default || nf);
  } catch (err) {
    return null;
  }
}

async function setupTokens() {
  const fetchFn = getFetch();
  if (!fetchFn) throw new Error('Fetch not available');

  const { API_BASE_URL, TEST_EMAIL, TEST_PASSWORD } = process.env;
  if (!API_BASE_URL || !TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error('Missing API_BASE_URL, TEST_EMAIL, or TEST_PASSWORD in .env');
  }
  
  // Read current tokens from variable.json
  const variablePath = path.join(__dirname, '../variable.json');
  let currentTokens = { EXPIRED_TOKEN: '', VALID_TOKEN: '' };
  
  if (fs.existsSync(variablePath)) {
    currentTokens = JSON.parse(fs.readFileSync(variablePath, 'utf8'));
  }

  // Get new token
  const response = await fetchFn(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });

  if (!response.ok) throw new Error(`Login failed: ${response.status}`);
  
  const data = await response.json();
  const newToken = data?.data?.token;
  if (!newToken) throw new Error('No token in response');

  // Rotate tokens: current VALID_TOKEN becomes EXPIRED_TOKEN
  const updatedTokens = {
    EXPIRED_TOKEN: currentTokens.VALID_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdXRob3JpdGllcyI6WyJVU0VSIl0sInN1YiI6InRvYW55b2dhbWVAZ21haWwuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vdYo',
    VALID_TOKEN: newToken
  };

  // Save to variable.json
  fs.writeFileSync(variablePath, JSON.stringify(updatedTokens, null, 2), 'utf8');
  
  console.log('🔐 Tokens refreshed');

  return updatedTokens;
}

// Load tokens from variable.json
function loadTokens() {
  const variablePath = path.join(__dirname, '../variable.json');
  if (!fs.existsSync(variablePath)) {
    return { EXPIRED_TOKEN: '', VALID_TOKEN: '' };
  }
  return JSON.parse(fs.readFileSync(variablePath, 'utf8'));
}

module.exports = { setupTokens, loadTokens };
