/**
 * Test Database Helper - Shared Connection Pool
 * Singleton pattern for database pool management across test files
 * Ensures only one pool is created per Jest worker
 */

const { initializeDatabase, getDb } = require('../../services/database');

let dbInitialized = false;

/**
 * Get or initialize the shared test database connection pool
 * This function ensures the database is initialized only once per Jest worker
 * @returns {Promise<mysql.Pool>}
 */
async function getTestDatabase() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
  return getDb();
}

/**
 * Get the database pool without initialization
 * Throws error if database hasn't been initialized yet
 * @returns {mysql.Pool}
 */
function getTestDatabaseSync() {
  if (!dbInitialized) {
    throw new Error('Test database not initialized. Call getTestDatabase() first.');
  }
  return getDb();
}

/**
 * Reset the initialization flag (useful for testing)
 * @private
 */
function resetTestDatabase() {
  dbInitialized = false;
}

module.exports = {
  getTestDatabase,
  getTestDatabaseSync,
  resetTestDatabase,
};
