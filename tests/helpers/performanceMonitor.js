/**
 * Test Performance Monitor
 * Tracks and reports slow tests to help identify performance bottlenecks
 *
 * Features:
 * - Automatic tracking of test execution times
 * - Highlights tests slower than threshold
 * - Generates performance report at end of suite
 * - Helps identify tests that need optimization
 */

const chalk = require('chalk') || { yellow: (s) => s, red: (s) => s, green: (s) => s };

// Configuration
const SLOW_TEST_THRESHOLD = 1000; // 1 second
const VERY_SLOW_TEST_THRESHOLD = 3000; // 3 seconds

// Storage for test performance data
const testPerformance = [];
let suiteStartTime = null;
let currentTestStart = null;

/**
 * Initialize performance monitoring
 * Call this in your test setup file (e.g., setup-backend.js)
 */
function initializePerformanceMonitoring() {
    if (process.env.DISABLE_PERF_MONITOR === 'true') {
        return;
    }

    // Track suite start time
    beforeAll(() => {
        suiteStartTime = Date.now();
    });

    // Track individual test times
    beforeEach(function () {
        currentTestStart = Date.now();
    });

    afterEach(function () {
        if (!currentTestStart) return;

        const duration = Date.now() - currentTestStart;
        const testName = this.currentTest?.fullTitle() || 'Unknown test';
        const testFile = this.currentTest?.file || 'Unknown file';

        testPerformance.push({
            name: testName,
            file: testFile,
            duration,
            isSlow: duration > SLOW_TEST_THRESHOLD,
            isVerySlow: duration > VERY_SLOW_TEST_THRESHOLD
        });

        // Log slow tests immediately during execution
        if (duration > VERY_SLOW_TEST_THRESHOLD) {
            console.warn(`⚠️  Very slow test (${duration}ms): ${testName}`);
        } else if (duration > SLOW_TEST_THRESHOLD) {
            console.warn(`⏱️  Slow test (${duration}ms): ${testName}`);
        }

        currentTestStart = null;
    });

    // Generate report after all tests
    afterAll(() => {
        if (testPerformance.length === 0) return;

        generatePerformanceReport();
    });
}

/**
 * Generate and display performance report
 * @private
 */
function generatePerformanceReport() {
    const slowTests = testPerformance.filter(t => t.isSlow);
    const verySlowTests = testPerformance.filter(t => t.isVerySlow);

    if (slowTests.length === 0) {
        console.log('\n✅ All tests completed within acceptable time (<1s each)');
        return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST PERFORMANCE REPORT');
    console.log('='.repeat(80));

    // Summary statistics
    const totalTests = testPerformance.length;
    const totalDuration = testPerformance.reduce((sum, t) => sum + t.duration, 0);
    const avgDuration = Math.round(totalDuration / totalTests);
    const maxDuration = Math.max(...testPerformance.map(t => t.duration));

    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`Total Time: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Average: ${avgDuration}ms per test`);
    console.log(`Slowest: ${maxDuration}ms`);

    // Very slow tests (>3s)
    if (verySlowTests.length > 0) {
        console.log(`\n🔴 VERY SLOW TESTS (>${VERY_SLOW_TEST_THRESHOLD}ms):`);
        verySlowTests
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10) // Top 10
            .forEach((test, index) => {
                console.log(`  ${index + 1}. ${test.duration}ms - ${test.name}`);
            });
    }

    // Slow tests (1-3s)
    const moderatelySlowTests = slowTests.filter(t => !t.isVerySlow);
    if (moderatelySlowTests.length > 0) {
        console.log(`\n⚠️  SLOW TESTS (${SLOW_TEST_THRESHOLD}-${VERY_SLOW_TEST_THRESHOLD}ms):`);
        moderatelySlowTests
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10) // Top 10
            .forEach((test, index) => {
                console.log(`  ${index + 1}. ${test.duration}ms - ${test.name}`);
            });
    }

    // Optimization suggestions
    console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
    if (verySlowTests.some(t => t.name.includes('admin'))) {
        console.log('  • Admin tests are slow - consider using seedAdminUser() instead of HTTP');
    }
    if (verySlowTests.some(t => t.name.includes('database') || t.name.includes('DB'))) {
        console.log('  • Database tests are slow - consider transaction-based isolation');
    }
    if (slowTests.length > totalTests * 0.3) {
        console.log('  • >30% of tests are slow - consider parallel execution with --maxWorkers');
    }

    console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Get performance data for analysis
 * @returns {Array<Object>} Array of test performance objects
 */
function getPerformanceData() {
    return [...testPerformance];
}

/**
 * Clear performance data (useful for testing)
 * @private
 */
function clearPerformanceData() {
    testPerformance.length = 0;
    suiteStartTime = null;
    currentTestStart = null;
}

/**
 * Export performance data to JSON file
 * @param {string} filepath - Path to save JSON file
 */
function exportPerformanceData(filepath = './test-performance.json') {
    const fs = require('fs');

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests: testPerformance.length,
            totalDuration: testPerformance.reduce((sum, t) => sum + t.duration, 0),
            slowTests: testPerformance.filter(t => t.isSlow).length,
            verySlowTests: testPerformance.filter(t => t.isVerySlow).length
        },
        tests: testPerformance.sort((a, b) => b.duration - a.duration)
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`\n📁 Performance data exported to: ${filepath}`);
}

module.exports = {
    initializePerformanceMonitoring,
    getPerformanceData,
    clearPerformanceData,
    exportPerformanceData,
    SLOW_TEST_THRESHOLD,
    VERY_SLOW_TEST_THRESHOLD
};
