/**
 * Database Service - MySQL Connection Pool
 * Singleton pattern for connection management
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load appropriate environment file based on NODE_ENV
// Test environment loads .env.test, otherwise loads default .env
if (process.env.NODE_ENV === 'test' && !process.env.DB_USER) {
  dotenv.config({ path: '.env.test' });
} else if (!process.env.DB_USER) {
  dotenv.config();
}

let pool = null;

/**
 * Initialize MySQL connection pool
 * @returns {Promise<mysql.Pool>}
 */
async function initializeDatabase() {
  if (pool) {
    return pool;
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      timezone: '+00:00', // Store all times in UTC
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('✓ MySQL database connected successfully');
    connection.release();

    return pool;
  } catch (error) {
    console.error('✗ MySQL connection error:', error.message);
    throw error;
  }
}

/**
 * Get database connection pool
 * @returns {mysql.Pool}
 */
function getDb() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Close database connection pool
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✓ MySQL database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  getDb,
  closeDatabase,
};
