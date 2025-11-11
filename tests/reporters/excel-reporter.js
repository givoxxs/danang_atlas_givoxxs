const path = require('path');
const { generateComprehensiveExcelReport, loadTestExecutionData } = require(path.join(__dirname, '../../scripts/generate-comprehensive-excel'));

/**
 * Professional Custom Jest Reporter
 * Automatically generates comprehensive Excel reports after all tests complete
 * 
 * This reporter leverages detailed test execution data captured by requestRunner
 * to create multi-sheet Excel reports with complete request/response information.
 */
class ExcelTestReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    console.log('\n📊 Generating Excel report...');
    
    // Load detailed test execution data from requestRunner
    const testExecutionData = loadTestExecutionData();
    
    if (testExecutionData.length === 0) {
      console.log('⚠️  No detailed test execution data captured.');
      console.log('   This might happen if tests were skipped or failed before execution.');
      return;
    }

    // Generate timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const outputDir = path.join(__dirname, '../../reports');
    const timestampedPath = path.join(outputDir, `test-report-${timestamp}.xlsx`);
    const latestPath = path.join(outputDir, 'test-report-latest.xlsx');

    try {
      // Generate both timestamped and latest versions
      generateComprehensiveExcelReport(testExecutionData, timestampedPath);
      generateComprehensiveExcelReport(testExecutionData, latestPath);
      
      console.log('\n✅ Excel report generated: ' + timestampedPath);
      console.log('\n✅ Excel report generated: ' + latestPath);
    } catch (error) {
      console.error('\n❌ Failed to generate Excel report:', error.message);
      console.error(error.stack);
    }
  }
}

module.exports = ExcelTestReporter;
