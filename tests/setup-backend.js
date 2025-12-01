/**
 * Jest Backend Test Setup
 * Configures test environment for backend (Node.js) tests
 */

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Mock console to reduce noise (keep errors visible)
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error visible for debugging
    error: console.error
};

// Global test timeout (10 seconds for database operations)
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
    // Close any open database connections
    const { closeDatabase } = require('../services/database');
    try {
        await closeDatabase();
    } catch (error) {
        // Ignore if database wasn't initialized
    }
});
