/**
 * Jest Test Setup
 * Configures global test environment settings and utilities
 */

// Import testing library extensions
require('@testing-library/jest-dom');

// Mock console methods to reduce noise in test output
global.console = {
    ...console,
    // Uncomment to suppress console logs in tests
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    // warn: jest.fn(),
    error: jest.fn(), // Keep error logging visible
};
