# DaNang Culinary Atlas - Professional API Test Suite 🍜

> **Testing Automation Framework** với comprehensive Excel reporting, data-driven testing, và automatic token management.

## Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment
Edit `.env` file:
\`\`\`properties
API_BASE_URL=https://danangculinaryatlas.site
TEST_EMAIL=toanyogame@gmail.com
TEST_PASSWORD=Toan@1234
TEST_RESTAURANT_ID=00207351-181d-4af4-9524-2f420c4225fd
\`\`\`

### 3. Run Tests

**All API tests with auto Excel report** (recommended):
\`\`\`bash
npm test
\`\`\`
*Automatically generates:*
- `reports/test-report-latest.xlsx` - Most recent report
- `reports/test-report-[timestamp].xlsx` - Historical report
- `reports/test-report.html` - HTML format

**Test specific features**:
\`\`\`bash
npm run test:auth         # Authentication tests only
npm run test:profile      # Profile API tests only  
npm run test:restaurant   # Restaurant API tests only
\`\`\`

**Generate Excel from existing data**:
\`\`\`bash
npm run export:excel
\`\`\`

### 4. View Comprehensive Reports

**Professional Excel Report** (4 sheets):
\`\`\`bash
open reports/test-report-latest.xlsx
\`\`\`

**Sheet Structure:**
1. **Summary** - Executive overview with statistics
2. **Auth Tests** - Authentication test details with request/response
3. **Profile Tests** - Profile API test details with full data
4. **Restaurant Tests** - Restaurant API test details with validation

Each detail sheet includes:
- ✅ Test Case ID, Name, Description
- ✅ HTTP Method & Endpoint
- ✅ Request Headers & Body
- ✅ Expected Status & Response
- ✅ Actual Status & Response (full JSON)
- ✅ Pass/Fail Result
- ✅ Execution Duration
- ✅ Error Messages (if any)

**HTML Report**:
\`\`\`bash
open reports/test-report.html
\`\`\`

## Test Coverage

### API Tests: 31 Test Cases (100% Pass Rate)

✅ **Authentication** (`POST /api/v1/auth/login`) - 5 test cases
- TC-AUTH-01: Login with valid credentials (saves token for other tests)
- TC-AUTH-02: Login with invalid email
- TC-AUTH-03: Login with missing password
- TC-AUTH-04: Login with invalid password
- TC-AUTH-05: Login with empty body

✅ **User Profile** (`GET /api/v1/profile/user`) - 15 test cases
- TC-PROFILE-01: Get profile with valid token
- TC-PROFILE-02: Get profile without token (401)
- TC-PROFILE-03: Get profile with invalid token (401)
- TC-PROFILE-04: Get profile with expired token (401)
- TC-PROFILE-05: Verify email field
- TC-PROFILE-06: Verify fullName field
- TC-PROFILE-07: Verify avatarUrl field
- TC-PROFILE-08: Verify status field
- TC-PROFILE-09: Empty Bearer token (401)
- TC-PROFILE-10: Without Bearer keyword (401)
- TC-PROFILE-11: Complete data structure validation
- TC-PROFILE-12: Token in query parameter (401)
- TC-PROFILE-13: Malformed Authorization header (401)
- TC-PROFILE-14: Verify response status field
- TC-PROFILE-15: Case-sensitive token verification

✅ **Restaurant Detail** (`GET /api/v1/restaurants/{id}`) - 11 test cases
- TC01: Get restaurant with valid ID
- TC02: Verify all required fields
- TC03: Non-existent ID (404)
- TC04: Malformed ID (400)
- TC05: Verify images structure
- TC06: Verify location coordinates
- TC07: Verify opening hours
- TC08: Verify rating information
- TC09: Empty ID (500)
- TC10: Verify status field
- TC11: Using environment variable

## Test Results

\`\`\`
Test Suites: 1 passed, 1 total
Tests:       31 passed, 31 total
Success Rate: 100% ✅
Duration:    ~2.5s
\`\`\`

### Excel Report Features
- ✅ Detailed test results with pass/fail status
- ✅ Test execution time for each case
- ✅ Summary sheet with statistics
- ✅ Error messages for failed tests
- ✅ Timestamped reports

## Project Structure

\`\`\`
danang_atlas/
├── tests/
│   ├── api.test.js                      # Main test runner
│   ├── helpers/
│   │   └── requestRunner.js             # HTTP client with token management
│   └── testcases/
│       ├── auth_login.json              # Authentication (1 TC - for token)
│       ├── profile_user.json            # User Profile (15 TCs)
│       └── restaurants_by_id.json       # Restaurant Detail (11 TCs)
├── scripts/
│   └── export-to-excel.js               # Excel report generator
├── reports/
│   ├── test-results.json                # JSON test results
│   ├── test-results.xlsx                # Excel report ⭐
│   └── test-report.html                 # HTML report
└── .env                                 # Environment configuration
\`\`\`

## Adding New Tests

### For Profile Tests
Edit `tests/testcases/profile_user.json`:

\`\`\`json
{
  "name": "TC-PROFILE-16: Your test name",
  "method": "GET",
  "path": "/api/v1/profile/user",
  "useToken": "userAccessToken",
  "expectedStatus": 200,
  "validateFields": ["data.field"]
}
\`\`\`

### For Restaurant Tests
Edit `tests/testcases/restaurants_by_id.json`:

\`\`\`json
{
  "name": "TC12: Your test name",
  "method": "GET",
  "path": "/api/v1/restaurants/{id}",
  "expectedStatus": 200,
  "validateFields": ["field1", "field2"]
}
\`\`\`

## Documentation

📖 **Complete Analysis**: See [ANALYSIS.md](./ANALYSIS.md) for:
- Detailed test scenarios
- Architecture design
- Technical implementation
- Development process

## Features

- ✅ Data-driven testing with JSON
- ✅ Automatic token management
- ✅ HTML test reports
- ✅ Response field validation
- ✅ Environment-based configuration

## Technologies

- **Jest** 29.7.0 - Test framework
- **node-fetch** 3.3.0 - HTTP client
- **dotenv** 16.6.1 - Environment configuration
- **xlsx** 0.18.5 - Excel export

## Test Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all API tests |
| `npm run test:with-report` | Run tests + generate Excel report |
| `npm run test:profile` | Test Profile API only |
| `npm run test:restaurant` | Test Restaurant API only |
| `npm run export:excel` | Generate Excel from existing JSON results |

## Output Files

- `reports/test-results.xlsx` - **Excel report** with summary and detailed results
- `reports/test-results.json` - JSON format for CI/CD integration
- `reports/test-report.html` - HTML report with visual charts

---

**Made with ❤️ for DaNang Culinary Atlas**
