#!/bin/bash

# Coverage Report Script
# Generates and displays test coverage reports for NT-TaxOffice

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}NT-TaxOffice Coverage Report${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if we should run tests or use existing coverage
RUN_TESTS=${1:-"yes"}

if [ "$RUN_TESTS" = "yes" ]; then
    echo -e "${YELLOW}Running tests with coverage...${NC}"
    npm run test:coverage
    echo ""
fi

# Check if coverage directory exists
if [ ! -d "coverage" ]; then
    echo -e "${RED}Error: No coverage data found.${NC}"
    echo -e "${YELLOW}Run: npm run test:coverage${NC}"
    exit 1
fi

# Display coverage summary
echo -e "${GREEN}Coverage Summary:${NC}"
echo ""

if [ -f "coverage/coverage-summary.json" ]; then
    # Parse and display coverage summary using Node.js
    node -e "
    const fs = require('fs');
    const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
    const total = summary.total;

    console.log('  Statements   : ' + total.statements.pct + '%' + ' (' + total.statements.covered + '/' + total.statements.total + ')');
    console.log('  Branches     : ' + total.branches.pct + '%' + ' (' + total.branches.covered + '/' + total.branches.total + ')');
    console.log('  Functions    : ' + total.functions.pct + '%' + ' (' + total.functions.covered + '/' + total.functions.total + ')');
    console.log('  Lines        : ' + total.lines.pct + '%' + ' (' + total.lines.covered + '/' + total.lines.total + ')');
    "
    echo ""
fi

# Check coverage thresholds
echo -e "${BLUE}Coverage Analysis:${NC}"
echo ""

node -e "
const fs = require('fs');
const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
const total = summary.total;

const thresholds = {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70
};

let passed = true;

Object.keys(thresholds).forEach(metric => {
    const actual = total[metric].pct;
    const threshold = thresholds[metric];
    const status = actual >= threshold ? '✓' : '✗';
    const color = actual >= threshold ? '\x1b[32m' : '\x1b[31m';

    console.log(\`  \${color}\${status}\x1b[0m \${metric.padEnd(12)} : \${actual}% (threshold: \${threshold}%)\`);

    if (actual < threshold) {
        passed = false;
    }
});

console.log('');

if (passed) {
    console.log('\x1b[32m✓ All coverage thresholds met!\x1b[0m');
} else {
    console.log('\x1b[33m⚠ Some coverage thresholds not met\x1b[0m');
}

process.exit(passed ? 0 : 1);
" && COVERAGE_PASSED=true || COVERAGE_PASSED=false

echo ""

# Display files with low coverage
echo -e "${YELLOW}Files with coverage below 70%:${NC}"
echo ""

node -e "
const fs = require('fs');
const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));

let lowCoverageFiles = [];

Object.keys(summary).forEach(file => {
    if (file === 'total') return;

    const metrics = summary[file];
    const avgCoverage = (
        metrics.statements.pct +
        metrics.branches.pct +
        metrics.functions.pct +
        metrics.lines.pct
    ) / 4;

    if (avgCoverage < 70) {
        lowCoverageFiles.push({
            file: file.replace(process.cwd() + '/', ''),
            coverage: avgCoverage.toFixed(2)
        });
    }
});

if (lowCoverageFiles.length === 0) {
    console.log('  \x1b[32m✓ No files with low coverage!\x1b[0m');
} else {
    lowCoverageFiles
        .sort((a, b) => parseFloat(a.coverage) - parseFloat(b.coverage))
        .forEach(item => {
            console.log(\`  \x1b[31m•\x1b[0m \${item.file} (\${item.coverage}%)\`);
        });
}
"

echo ""
echo -e "${BLUE}================================${NC}"
echo ""

# Offer to open HTML report
if command -v xdg-open &> /dev/null; then
    OPEN_CMD="xdg-open"
elif command -v open &> /dev/null; then
    OPEN_CMD="open"
else
    OPEN_CMD=""
fi

if [ -n "$OPEN_CMD" ] && [ -f "coverage/lcov-report/index.html" ]; then
    echo -e "${GREEN}HTML Report: coverage/lcov-report/index.html${NC}"
    read -p "Open HTML report in browser? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $OPEN_CMD coverage/lcov-report/index.html
    fi
else
    echo -e "${GREEN}HTML Report: coverage/lcov-report/index.html${NC}"
    echo -e "${YELLOW}Open this file in your browser to view detailed coverage.${NC}"
fi

echo ""

# Exit with appropriate code
if [ "$COVERAGE_PASSED" = true ]; then
    exit 0
else
    exit 1
fi
