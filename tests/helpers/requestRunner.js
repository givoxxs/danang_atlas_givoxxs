const fs = require('fs');
const path = require('path');

const TEST_DATA_FILE = path.join(__dirname, '../../reports/test-execution-data.json');
const executionLog = [];

function getFetch() {
  if (typeof fetch === 'function') return fetch;
  try {
    // eslint-disable-next-line global-require
    const nf = require('node-fetch');
    return nf && (nf.default || nf);
  } catch (err) {
    return null;
  }
}

function replaceEnvPlaceholders(value) {
  return String(value).replace(/\$\{([^}]+)\}/g, (_, name) => process.env[name] || '');
}

function buildUrl(baseUrl, rawPath) {
  const base = baseUrl.replace(/\/$/, '');
  const pathPart = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${base}${pathPart}`;
}

function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  if (sanitized.Authorization) {
    sanitized.Authorization = 'Bearer [REDACTED]';
  }
  return sanitized;
}

function prepareRequestInit(tc) {
  const init = {
    method: (tc.method || 'GET').toUpperCase(),
    headers: { ...(tc.headers || {}) }
  };

  if (tc.useToken) {
    const tokenKey = tc.useToken;
    const token = process.env[tokenKey];
    if (!token) {
      throw new Error(`Token '${tokenKey}' not found in environment variables.`);
    }
    init.headers.Authorization = `Bearer ${token}`;
  }

  if (init.headers.Authorization) {
    init.headers.Authorization = replaceEnvPlaceholders(init.headers.Authorization);
  }

  if (tc.body) {
    const hasContentType = Object.keys(init.headers).some(
      key => key.toLowerCase() === 'content-type'
    );
    if (!hasContentType) {
      init.headers['Content-Type'] = 'application/json';
    }
    init.body = typeof tc.body === 'string' ? tc.body : JSON.stringify(tc.body);
  }

  return init;
}

async function parseResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    return text;
  }
}

function resolveExpectedBody(tc) {
  if (Object.prototype.hasOwnProperty.call(tc, 'expectedBody')) return tc.expectedBody;
  if (Object.prototype.hasOwnProperty.call(tc, 'expectedOutput')) return tc.expectedOutput;
  return undefined;
}

function assertResponse(tc, status, body) {
  if (typeof tc.expectedStatus !== 'undefined') {
    expect(status).toBe(tc.expectedStatus);
  }

  const expectedBody = resolveExpectedBody(tc);
  if (typeof expectedBody !== 'undefined') {
    if (tc.partialMatch) {
      expect(body).toEqual(expect.objectContaining(expectedBody));
    } else {
      expect(body).toEqual(expectedBody);
    }
  }

  if (Array.isArray(tc.validateFields) && body !== null && typeof body === 'object') {
    tc.validateFields.forEach(field => {
      const value = field.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), body);
      expect(value).toBeDefined();
    });
  }
}

function recordExecution({ tc, requestDetails, expectedResponse, actualStatus, actualResponse, result, error }) {
  executionLog.push({
    testCase: tc,
    request: requestDetails,
    expectedStatus: tc.expectedStatus,
    expectedResponse,
    actualStatus,
    actualResponse,
    result,
    duration: requestDetails.duration,
    error,
    timestamp: new Date().toISOString()
  });
  persistExecutionLog();
}

function persistExecutionLog() {
  try {
    const dir = path.dirname(TEST_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(executionLog, null, 2));
  } catch (err) {
    console.error('Failed to save test execution data:', err.message);
  }
}

async function runCase(tc) {
  if (!tc) throw new Error('Testcase is null/empty — check your JSON files.');

  const fetchFn = getFetch();
  if (!fetchFn) throw new Error('No fetch available: use Node 18+ or install node-fetch.');

  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) throw new Error('API_BASE_URL is not set in environment for external tests.');

  const rawPath = tc.path ? replaceEnvPlaceholders(tc.path) : '';
  if (!rawPath) throw new Error('Testcase path is empty after environment substitution.');

  const url = buildUrl(baseUrl, rawPath);
  const init = prepareRequestInit(tc);
  const requestStartedAt = Date.now();

  const requestDetails = {
    method: init.method,
    url,
    headers: sanitizeHeaders(init.headers),
    body: tc.body || null,
    duration: 0
  };

  let actualStatus = null;
  let actualResponse = null;
  const expectedResponseForLogging = (() => {
    const expected = resolveExpectedBody(tc);
    return typeof expected !== 'undefined' ? expected : tc.validateFields || null;
  })();

  try {
    const res = await fetchFn(url, init);
    actualStatus = res.status;
    actualResponse = await parseResponse(res);

    assertResponse(tc, actualStatus, actualResponse);

    requestDetails.duration = Date.now() - requestStartedAt;
    recordExecution({
      tc,
      requestDetails,
      expectedResponse: expectedResponseForLogging,
      actualStatus,
      actualResponse,
      result: 'PASS',
      error: ''
    });
  } catch (error) {
    requestDetails.duration = Date.now() - requestStartedAt;
    recordExecution({
      tc,
      requestDetails,
      expectedResponse: expectedResponseForLogging,
      actualStatus,
      actualResponse,
      result: 'FAIL',
      error: error.message
    });
    throw error;
  }
}

function getTestExecutionData() {
  return executionLog;
}

function clearTestExecutionData() {
  executionLog.length = 0;
  if (fs.existsSync(TEST_DATA_FILE)) {
    fs.unlinkSync(TEST_DATA_FILE);
  }
}

module.exports = {
  runCase,
  getTestExecutionData,
  clearTestExecutionData
};