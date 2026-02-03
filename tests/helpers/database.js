/**
 * Database Test Helpers
 * Utilities for managing test database state
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

/**
 * Create a test database connection (bypassing the pool)
 * @returns {Promise<mysql.Connection>}
 */
async function createTestConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });
}

/**
 * Create test database if it doesn't exist
 * @returns {Promise<void>}
 */
async function createTestDatabase() {
  const connection = await createTestConnection();

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✓ Test database '${process.env.DB_NAME}' ready`);
  } finally {
    await connection.end();
  }
}

/**
 * Drop test database
 * @returns {Promise<void>}
 */
async function dropTestDatabase() {
  const connection = await createTestConnection();

  try {
    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    console.log(`✓ Test database '${process.env.DB_NAME}' dropped`);
  } finally {
    await connection.end();
  }
}

/**
 * Initialize test database schema
 * @returns {Promise<void>}
 */
async function initializeTestSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    // Execute schema
    await connection.query(schema);
    console.log('✓ Test database schema initialized');
  } finally {
    await connection.end();
  }
}

/**
 * Clear all data from test database tables
 * Uses the shared connection pool for better performance
 * @param {mysql.Pool} [pool] - Optional connection pool, will use shared pool if not provided
 * @returns {Promise<void>}
 */
async function clearTestDatabase(pool = null) {
  // Use provided pool or get the shared test database pool
  const dbPool = pool || require('./testDatabase').getTestDatabaseSync();
  const connection = await dbPool.getConnection();

  try {
    // Disable foreign key checks temporarily
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Truncate all tables
    await connection.query('TRUNCATE TABLE email_queue');
    await connection.query('TRUNCATE TABLE appointment_history');
    await connection.query('TRUNCATE TABLE appointments');
    await connection.query('TRUNCATE TABLE blocked_dates');
    await connection.query('TRUNCATE TABLE availability_settings');
    await connection.query('TRUNCATE TABLE admin_users');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Re-insert default availability settings
    await connection.query(`
            INSERT INTO availability_settings (day_of_week, is_working_day, start_time, end_time) VALUES
            (0, FALSE, NULL, NULL),  -- Sunday
            (1, TRUE, '09:00:00', '17:00:00'),  -- Monday
            (2, TRUE, '09:00:00', '17:00:00'),  -- Tuesday
            (3, TRUE, '09:00:00', '17:00:00'),  -- Wednesday
            (4, TRUE, '09:00:00', '17:00:00'),  -- Thursday
            (5, TRUE, '09:00:00', '17:00:00'),  -- Friday
            (6, FALSE, NULL, NULL)   -- Saturday
        `);
  } finally {
    // Release connection back to pool instead of closing it
    connection.release();
  }
}

/**
 * Execute raw SQL query on test database
 * Uses the shared connection pool for better performance
 * @param {string} sql
 * @param {Array} params
 * @param {mysql.Pool} [pool] - Optional connection pool, will use shared pool if not provided
 * @returns {Promise<Array>}
 */
async function query(sql, params = [], pool = null) {
  // Use provided pool or get the shared test database pool
  const dbPool = pool || require('./testDatabase').getTestDatabaseSync();
  const connection = await dbPool.getConnection();

  try {
    const results = await connection.query(sql, params);
    return results;
  } finally {
    // Release connection back to pool instead of closing it
    connection.release();
  }
}

/**
 * Setup test database (create and initialize)
 * Call this before running tests
 * @returns {Promise<void>}
 */
async function setupTestDatabase() {
  await createTestDatabase();
  await initializeTestSchema();
}

/**
 * Teardown test database (drop)
 * Call this after all tests complete
 * @returns {Promise<void>}
 */
async function teardownTestDatabase() {
  await dropTestDatabase();
}

module.exports = {
  createTestConnection,
  createTestDatabase,
  dropTestDatabase,
  initializeTestSchema,
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
  query,
};
