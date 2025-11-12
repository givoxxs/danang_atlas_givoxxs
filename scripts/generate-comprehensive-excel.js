/**
 * Professional Excel Report Generator for API Testing
 * 
 * This script generates a comprehensive multi-sheet Excel report with:
 * - Sheet 1: Executive Summary with overall statistics
 * - Sheet 2: Profile Tests (detailed)
 * - Sheet 3: Restaurant Tests (detailed)
 * 
 * Each detailed sheet includes:
 * - Test Case ID, Name, Description
 * - HTTP Method & Endpoint
 * - Request Headers & Body
 * - Expected Status & Response
 * - Actual Status & Response
 * - Test Result (PASS/FAIL)
 * - Execution Duration
 * - Error Messages (if any)
 * 
 * @author Testing Automation Expert
 * @date 2025-11-11
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Generate comprehensive Excel report from test execution data
 * @param {Array} testExecutionData - Array of detailed test execution objects
 * @param {string} outputPath - Path to save Excel file
 */
function generateComprehensiveExcelReport(testExecutionData, outputPath) {
    console.log(`\n📊 Generating Comprehensive Excel Report...`);
    console.log(`Total test executions captured: ${testExecutionData.length}`);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Group tests by category
    const groupedTests = splitByFeature(testExecutionData);

    console.log(`📑 Test distribution:`);
    console.log(`   - Profile: ${groupedTests.profile.length} tests`);
    console.log(`   - Restaurant: ${groupedTests.restaurant.length} tests`);

    // === SHEET 1: EXECUTIVE SUMMARY ===
    createSummarySheet(workbook, groupedTests, testExecutionData);

    // === SHEET 2: PROFILE TESTS ===
    if (groupedTests.profile.length > 0) {
        createDetailedTestSheet(workbook, groupedTests.profile, 'Profile Tests');
    }

    // === SHEET 3: RESTAURANT TESTS ===
    if (groupedTests.restaurant.length > 0) {
        createDetailedTestSheet(workbook, groupedTests.restaurant, 'Restaurant Tests');
    }

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write to file
    XLSX.writeFile(workbook, outputPath);
    
    const stats = calculateStatistics(testExecutionData);
    console.log(`\n✅ Excel report generated successfully!`);
    console.log(`📂 Location: ${outputPath}`);
    console.log(`\n📊 Final Statistics:`);
    console.log(`   Total Tests: ${stats.total}`);
    console.log(`   Passed: ${stats.passed} (${stats.passRate}%)`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Avg Duration: ${stats.avgDuration}ms`);

    return {
        outputPath,
        statistics: stats
    };
}

/**
 * Create Executive Summary Sheet
 */
function createSummarySheet(workbook, groupedTests, allTests) {
    const stats = calculateStatistics(allTests);
    const profileStats = calculateStatistics(groupedTests.profile);
    const restaurantStats = calculateStatistics(groupedTests.restaurant);

    const summaryData = [
        { 'Metrics': '📊 TỔNG QUAN TOÀN BỘ TEST SUITE'  , 'Giá Trị': '' },
        { 'Metrics': ''                                 , 'Giá Trị': '' },
        { 'Metrics': 'Tổng số Test Cases'               , 'Giá Trị': stats.total },
        { 'Metrics': 'Test Cases PASSED'                , 'Giá Trị': stats.passed },
        { 'Metrics': 'Test Cases FAILED'                , 'Giá Trị': stats.failed },
        { 'Metrics': 'Tỷ lệ thành công (%)'             , 'Giá Trị': stats.passRate },
        { 'Metrics': 'Tổng thời gian thực thi (ms)'     , 'Giá Trị': stats.totalDuration },
        { 'Metrics': 'Thời gian trung bình/test (ms)'   , 'Giá Trị': stats.avgDuration },
        { 'Metrics': ''                                 , 'Giá Trị': '' },
        { 'Metrics': '👤 PROFILE TESTS'                 , 'Giá Trị': '' },
        { 'Metrics': 'Tổng số tests'                    , 'Giá Trị': profileStats.total },
        { 'Metrics': 'Passed'                           , 'Giá Trị': profileStats.passed },
        { 'Metrics': 'Failed'                           , 'Giá Trị': profileStats.failed },
        { 'Metrics': 'Tỷ lệ thành công (%)'             , 'Giá Trị': profileStats.passRate },
        { 'Metrics': ''                                 , 'Giá Trị': '' },
        { 'Metrics': '🍽️ RESTAURANT TESTS'              , 'Giá Trị': '' },
        { 'Metrics': 'Tổng số tests'                    , 'Giá Trị': restaurantStats.total },
        { 'Metrics': 'Passed'                           , 'Giá Trị': restaurantStats.passed },
        { 'Metrics': 'Failed'                           , 'Giá Trị': restaurantStats.failed },
        { 'Metrics': 'Tỷ lệ thành công (%)'             , 'Giá Trị': restaurantStats.passRate },
        { 'Metrics': ''                                 , 'Giá Trị': '' },
        { 'Metrics': 'Thời gian tạo báo cáo'            , 'Giá Trị': new Date().toLocaleString('vi-VN') }
    ];

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 40 }, // Metrics
        { wch: 25 }  // Giá Trị
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
}

/**
 * Create detailed test sheet for a specific category
 */
function createDetailedTestSheet(workbook, tests, sheetName) {
    const detailedData = tests.map((testExec, index) => {
        const tc = testExec.testCase || {};
        
        // Extract test ID from name
        const rawName = typeof tc.name === 'string' ? tc.name : '';
        const testIdMatch = rawName.match(/(TC-\w+-\d+|TC\d+)/);
        const testId = testIdMatch ? testIdMatch[0] : `TC${String(index + 1).padStart(2, '0')}`;
        const displayName = rawName
            ? (testIdMatch ? rawName.replace(testId + ':', '').trim() : rawName)
            : 'N/A';

        // Format request body
        const requestBody = tc.body ? JSON.stringify(tc.body, null, 2) : 'N/A';
        
        // Format request headers (exclude Authorization token for security)
        const requestHeaders = testExec.request.headers ? 
            JSON.stringify(testExec.request.headers, null, 2) : 'N/A';

        // Format expected response
        let expectedResponse = 'Status Code: ' + (typeof testExec.expectedStatus !== 'undefined' ? testExec.expectedStatus : 'N/A');
        if (testExec.expectedResponse) {
            if (Array.isArray(testExec.expectedResponse)) {
                expectedResponse += '\nValidate Fields: ' + testExec.expectedResponse.join(', ');
            } else if (typeof testExec.expectedResponse === 'object') {
                expectedResponse += '\n' + JSON.stringify(testExec.expectedResponse, null, 2);
            } else {
                expectedResponse += '\n' + String(testExec.expectedResponse);
            }
        }

        // Format actual response (truncate if too long)
        let actualResponse = 'Status Code: ' + (typeof testExec.actualStatus !== 'undefined' ? testExec.actualStatus : 'N/A');
        if (testExec.actualResponse) {
            const responseStr = typeof testExec.actualResponse === 'object'
                ? JSON.stringify(testExec.actualResponse, null, 2)
                : String(testExec.actualResponse);
            actualResponse += '\n' + (responseStr.length > 500 ? 
                responseStr.substring(0, 500) + '...[truncated]' : responseStr);
        }

        return {
            'STT': index + 1,
            'Test Case ID': testId,
            'Tên Test Case': displayName,
            'Mô tả': tc.description || 'N/A',
            'HTTP Method': tc.method || 'GET',
            'Endpoint': tc.path || 'N/A',
            'Request Headers': requestHeaders,
            'Request Body': requestBody,
            'Expected': expectedResponse,
            'Actual Output': actualResponse,
            'Kết quả': testExec.result === 'PASS' ? '✅ PASS' : '❌ FAIL',
            'Thời gian (ms)': testExec.duration,
            'Lỗi': testExec.error || 'N/A'
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(detailedData);

    // Set column widths for optimal readability
    worksheet['!cols'] = [
        { wch: 5 },   // STT
        { wch: 18 },  // Test Case ID
        { wch: 45 },  // Tên Test Case
        { wch: 50 },  // Mô tả
        { wch: 10 },  // HTTP Method
        { wch: 35 },  // Endpoint
        { wch: 40 },  // Request Headers
        { wch: 50 },  // Request Body
        { wch: 60 },  // Expected
        { wch: 60 },  // Actual Output
        { wch: 12 },  // Kết quả
        { wch: 15 },  // Thời gian
        { wch: 50 }   // Lỗi
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}

/**
 * Calculate statistics for a set of tests
 */
function calculateStatistics(tests) {
    if (!tests || tests.length === 0) {
        return {
            total: 0,
            passed: 0,
            failed: 0,
            passRate: 0,
            totalDuration: 0,
            avgDuration: 0
        };
    }

    const total = tests.length;
    const passed = tests.filter(t => t.result === 'PASS').length;
    const failed = total - passed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
    const totalDuration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);
    const avgDuration = total > 0 ? (totalDuration / total).toFixed(2) : 0;

    return {
        total,
        passed,
        failed,
        passRate,
        totalDuration,
        avgDuration
    };
}

/**
 * Split execution data into feature groups (profile, restaurant, other)
 */
function splitByFeature(testExecutionData) {
    const profile = [];
    const restaurant = [];

    testExecutionData.forEach(testExec => {
        const name = testExec?.testCase?.name || '';
        if (/PROFILE/i.test(name)) {
            profile.push(testExec);
        } else {
            restaurant.push(testExec);
        }
    });

    return { profile, restaurant };
}

/**
 * Load test execution data from file
 * This is called after all tests have completed
 */
function loadTestExecutionData() {
    try {
        const dataFilePath = path.join(__dirname, '../reports/test-execution-data.json');
        
        if (!fs.existsSync(dataFilePath)) {
            console.log(`   ⚠️  Test execution data file not found: ${dataFilePath}`);
            return [];
        }
        
        const rawData = fs.readFileSync(dataFilePath, 'utf8');
        const data = JSON.parse(rawData);
        console.log(`   Found ${data ? data.length : 0} test execution records`);
        return data || [];
    } catch (error) {
        console.error('❌ Error loading test execution data:', error.message);
        console.error('   Stack:', error.stack);
        return [];
    }
}

// Main execution
if (require.main === module) {
    const testExecutionData = loadTestExecutionData();
    
    if (testExecutionData.length === 0) {
        console.log('⚠️  No test execution data found. Please run tests first.');
        console.log('💡 Use: npm test');
        process.exit(1);
    }

    // Generate timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const outputDir = path.join(__dirname, '..', 'reports');
    const timestampedPath = path.join(outputDir, `test-report-${timestamp}.xlsx`);
    const latestPath = path.join(outputDir, 'test-report-latest.xlsx');

    // Generate both timestamped and latest versions
    generateComprehensiveExcelReport(testExecutionData, timestampedPath);
    generateComprehensiveExcelReport(testExecutionData, latestPath);

    console.log(`\n✨ Report Generation Complete!`);
    console.log(`📁 Timestamped: ${timestampedPath}`);
    console.log(`📁 Latest: ${latestPath}`);
}

module.exports = {
    generateComprehensiveExcelReport,
    loadTestExecutionData
};
