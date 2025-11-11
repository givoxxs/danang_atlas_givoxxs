// Helper to get a fetch function: prefer global fetch (Node 18+), else try node-fetch
function getFetch() {
  if (typeof fetch === 'function') return fetch;
  try {
    // eslint-disable-next-line global-require
    const nf = require('node-fetch');
    // node-fetch v3 exports default function under `.default` when required from CommonJS
    return nf && (nf.default || nf);
  } catch (err) {
    return null;
  }
}

const fs = require('fs');
const path = require('path');

// Global storage for tokens extracted from previous test responses
const tokenStore = {};

// Global storage for detailed test execution data (for Excel reporting)
const testExecutionData = [];

// File path for storing test execution data
const TEST_DATA_FILE = path.join(__dirname, '../../reports/test-execution-data.json');

async function runCase(tc) {
    if (!tc) throw new Error('Testcase is null/empty — check your JSON files.');
    const fetchFn = getFetch();
    if (!fetchFn) throw new Error('No fetch available: use Node 18+ or install node-fetch.');

    const base = process.env.API_BASE_URL;
    if (!base) throw new Error('API_BASE_URL is not set in environment for external tests.');

    // Allow environment placeholders in path: ${VAR} will be replaced with process.env.VAR
    const replaceEnvPlaceholders = s => String(s).replace(/\$\{([^}]+)\}/g, (_, name) => process.env[name] || '');

    // Build URL safely: ensure base has no trailing slash and path has leading slash
    const baseClean = base.replace(/\/$/, '');
    const rawPath = replaceEnvPlaceholders(tc.path || '');
    if (!rawPath) throw new Error('Testcase path is empty after environment substitution.');
    const pathPart = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const url = `${baseClean}${pathPart}`;

    const init = { method: tc.method || 'GET', headers: tc.headers ? { ...tc.headers } : {} };
    
    // Track request details for reporting
    const requestDetails = {
        method: init.method,
        url: url,
        headers: { ...init.headers },
        body: tc.body || null
    };
    
    // Support Bearer token from previous test response
    if (tc.useToken) {
        const tokenKey = tc.useToken;
        if (tokenStore[tokenKey]) {
            init.headers['Authorization'] = `Bearer ${tokenStore[tokenKey]}`;
            requestDetails.headers['Authorization'] = 'Bearer [TOKEN]'; // Mask token in report
        } else {
            throw new Error(`Token '${tokenKey}' not found in token store. Ensure the login test runs first.`);
        }
    }

    if (tc.body) {
        if (!Object.keys(init.headers).some(h => h.toLowerCase() === 'content-type')) {
        init.headers['Content-Type'] = 'application/json';
        }
        init.body = typeof tc.body === 'string' ? tc.body : JSON.stringify(tc.body);
    }

    const startTime = Date.now();
    let testResult = 'PASS';
    let errorMessage = '';
    let actualResponse = null;
    let actualStatus = null;

    try {
        const res = await fetchFn(url, init);
        actualStatus = res.status;
        // Try parse JSON, otherwise return text
        let body = null;
        const txt = await res.text();
        try { body = txt ? JSON.parse(txt) : null; } catch (e) { body = txt; }
        actualResponse = body;

        // Store token if saveToken is specified
        if (tc.saveToken && body) {
            const tokenPath = tc.saveToken.split('.');
            let tokenValue = body;
            for (const key of tokenPath) {
                tokenValue = tokenValue?.[key];
            }
            if (tokenValue) {
                const tokenKey = tc.saveTokenAs || 'accessToken';
                tokenStore[tokenKey] = tokenValue;
                console.log(`Saved token '${tokenKey}' from response path '${tc.saveToken}'`);
            } else {
                console.warn(`Could not extract token from path '${tc.saveToken}' in response`);
            }
        }

        if (typeof tc.expectedStatus !== 'undefined') {
            expect(actualStatus).toBe(tc.expectedStatus);
        }

        if (typeof tc.expectedBody !== 'undefined') {
            if (tc.partialMatch) {
            expect(body).toEqual(expect.objectContaining(tc.expectedBody));
            } else {
            expect(body).toEqual(tc.expectedBody);
            }
        }

        // Additional validation for response body fields
        if (tc.validateFields) {
            for (const field of tc.validateFields) {
                const fieldPath = field.split('.');
                let value = body;
                for (const key of fieldPath) {
                    value = value?.[key];
                }
                expect(value).toBeDefined();
            }
        }
        
        // If we reach here, test passed
        const duration = Date.now() - startTime;
        
        // Store detailed execution data for Excel report
        const executionRecord = {
            testCase: tc,
            request: requestDetails,
            expectedStatus: tc.expectedStatus,
            expectedResponse: tc.expectedBody || tc.validateFields || null,
            actualStatus: actualStatus,
            actualResponse: actualResponse,
            result: 'PASS',
            duration: duration,
            error: '',
            timestamp: new Date().toISOString()
        };
        
        testExecutionData.push(executionRecord);
        saveTestExecutionData();
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        // Store detailed execution data even for failed tests
        const executionRecord = {
            testCase: tc,
            request: requestDetails,
            expectedStatus: tc.expectedStatus,
            expectedResponse: tc.expectedBody || tc.validateFields || null,
            actualStatus: actualStatus,
            actualResponse: actualResponse,
            result: 'FAIL',
            duration: duration,
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        testExecutionData.push(executionRecord);
        saveTestExecutionData();
        
        throw error;
    }

}

// Function to save test execution data to file (persists across Jest processes)
function saveTestExecutionData() {
    try {
        const dir = path.dirname(TEST_DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(testExecutionData, null, 2));
    } catch (error) {
        console.error('Failed to save test execution data:', error.message);
    }
}

// Function to retrieve all test execution data
function getTestExecutionData() {
    return testExecutionData;
}

// Function to load test execution data from file
function loadTestExecutionDataFromFile() {
    try {
        if (fs.existsSync(TEST_DATA_FILE)) {
            const data = fs.readFileSync(TEST_DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to load test execution data from file:', error.message);
    }
    return [];
}

// Function to clear test execution data (useful for running multiple test suites)
function clearTestExecutionData() {
    testExecutionData.length = 0;
    if (fs.existsSync(TEST_DATA_FILE)) {
        fs.unlinkSync(TEST_DATA_FILE);
    }
}

module.exports = { 
    runCase, 
    tokenStore, 
    getTestExecutionData, 
    loadTestExecutionDataFromFile,
    clearTestExecutionData 
};