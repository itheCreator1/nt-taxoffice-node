/**
 * Transaction-Based Test Isolation Helper
 * Provides fast test isolation using database transactions
 *
 * Usage:
 * - Use this for unit tests that need database access
 * - Much faster than truncating tables (5-10ms vs 50-100ms)
 * - Automatically rolls back after each test
 */

const { getTestDatabaseSync } = require('./testDatabase');

/**
 * Setup transaction-based test isolation
 * Call this in your test file's beforeEach/afterEach hooks
 *
 * @returns {Object} Object with connection and helper methods
 *
 * @example
 * let transactionHelper;
 *
 * beforeEach(async () => {
 *     transactionHelper = await setupTransactionIsolation();
 * });
 *
 * afterEach(async () => {
 *     await cleanupTransactionIsolation(transactionHelper);
 * });
 */
async function setupTransactionIsolation() {
    const pool = getTestDatabaseSync();
    const connection = await pool.getConnection();

    // Start transaction
    await connection.beginTransaction();

    return {
        connection,
        pool,

        /**
         * Execute a query within the transaction
         * @param {string} sql - SQL query
         * @param {Array} params - Query parameters
         * @returns {Promise<Array>} Query results
         */
        query: async (sql, params = []) => {
            return await connection.query(sql, params);
        },

        /**
         * Get the underlying connection for advanced usage
         * @returns {Connection} MySQL connection
         */
        getConnection: () => connection
    };
}

/**
 * Cleanup transaction isolation
 * Rolls back the transaction and releases the connection
 *
 * @param {Object} transactionHelper - Helper object from setupTransactionIsolation
 * @returns {Promise<void>}
 */
async function cleanupTransactionIsolation(transactionHelper) {
    if (!transactionHelper || !transactionHelper.connection) {
        return;
    }

    try {
        // Rollback transaction (discards all changes)
        await transactionHelper.connection.rollback();
    } catch (error) {
        // Ignore rollback errors (transaction might be already rolled back)
    } finally {
        // Release connection back to pool
        transactionHelper.connection.release();
    }
}

/**
 * Wrapper function to run a test with transaction isolation
 * Simplifies setup/cleanup for individual tests
 *
 * @param {Function} testFn - Test function that receives transaction helper
 * @returns {Promise<void>}
 *
 * @example
 * test('should create user', async () => {
 *     await withTransaction(async (tx) => {
 *         await tx.query('INSERT INTO users (name) VALUES (?)', ['John']);
 *         const [rows] = await tx.query('SELECT * FROM users WHERE name = ?', ['John']);
 *         expect(rows.length).toBe(1);
 *     });
 * });
 */
async function withTransaction(testFn) {
    const helper = await setupTransactionIsolation();

    try {
        await testFn(helper);
    } finally {
        await cleanupTransactionIsolation(helper);
    }
}

/**
 * Create a test suite with automatic transaction isolation
 * All tests in the suite will automatically use transactions
 *
 * @param {string} description - Test suite description
 * @param {Function} suiteFn - Test suite function
 *
 * @example
 * describeWithTransactions('User Service', () => {
 *     test('should create user', async () => {
 *         // Transaction automatically active
 *         const db = getDb();
 *         await db.query('INSERT INTO users (name) VALUES (?)', ['John']);
 *     });
 * });
 */
function describeWithTransactions(description, suiteFn) {
    describe(description, () => {
        let transactionHelper;

        beforeEach(async () => {
            transactionHelper = await setupTransactionIsolation();

            // Make connection available globally for the test
            global.__testTransaction = transactionHelper;
        });

        afterEach(async () => {
            await cleanupTransactionIsolation(transactionHelper);
            delete global.__testTransaction;
        });

        suiteFn();
    });
}

module.exports = {
    setupTransactionIsolation,
    cleanupTransactionIsolation,
    withTransaction,
    describeWithTransactions
};
