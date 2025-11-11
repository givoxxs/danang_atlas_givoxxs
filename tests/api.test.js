const fs = require('fs');
const path = require('path');
const { runCase } = require('./helpers/requestRunner');

const testcasesDir = path.join(__dirname, 'testcases');

const files = fs.existsSync(testcasesDir)
  ? fs.readdirSync(testcasesDir).filter(f => f.endsWith('.json'))
  : [];

describe('API tests (from tests/testcases/*.json)', () => {
  files.forEach(file => {
    let cases = require(path.join(testcasesDir, file));
    if (!Array.isArray(cases)) cases = [];
    cases = cases.filter(Boolean);
    const featureName = path.basename(file, '.json');

    describe(featureName, () => {
      cases.forEach(tc => {
        test(tc.name, async () => {
          await runCase(tc);
        });
      });
    });
  });
});
