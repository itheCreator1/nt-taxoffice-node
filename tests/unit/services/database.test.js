/**
 * Unit Tests - Database Service
 * Tests for MySQL connection pool management
 */

// Mock mysql2/promise BEFORE any imports
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn()
}));

const mysql = require('mysql2/promise');

describe('Database Service', () => {
    let mockPool;
    let mockConnection;
    let database;

    beforeAll(() => {
        // Set up mocks once before all tests
        mockConnection = {
            release: jest.fn()
        };

        mockPool = {
            getConnection: jest.fn().mockResolvedValue(mockConnection),
            end: jest.fn().mockResolvedValue(undefined)
        };

        // Configure mysql mock
        mysql.createPool.mockReturnValue(mockPool);

        // Load database service
        database = require('../../../services/database');
    });

    beforeEach(() => {
        // Clear mock call history before each test
        jest.clearAllMocks();

        // Reset mock implementations
        mockConnection.release.mockClear();
        mockPool.getConnection.mockResolvedValue(mockConnection);
        mockPool.end.mockResolvedValue(undefined);

        // Mock console methods to avoid test output noise
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(async () => {
        // Restore console
        console.log.mockRestore();
        console.error.mockRestore();

        // Close database to reset state between tests
        await database.closeDatabase();
    });

    describe('initializeDatabase()', () => {
        test('should create connection pool successfully', async () => {
            process.env.DB_HOST = 'localhost';
            process.env.DB_PORT = '3306';
            process.env.DB_USER = 'testuser';
            process.env.DB_PASSWORD = 'testpass';
            process.env.DB_NAME = 'testdb';

            const result = await database.initializeDatabase();

            // Verify pool is created and returned
            expect(result).toBeDefined();
            expect(result.getConnection).toBeDefined();
        });

        test('should test connection on initialization', async () => {
            process.env.DB_HOST = 'localhost';
            delete process.env.DB_PORT;
            process.env.DB_USER = 'testuser';
            process.env.DB_PASSWORD = 'testpass';
            process.env.DB_NAME = 'testdb';

            await database.initializeDatabase();

            // Verify default behavior works
            expect(mockPool.getConnection).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });

        test('should verify connection works on initialization', async () => {
            await database.initializeDatabase();

            expect(mockPool.getConnection).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });

        test('should log success message', async () => {
            await database.initializeDatabase();

            expect(console.log).toHaveBeenCalledWith('✓ MySQL database connected successfully');
        });

        test('should return pool on successful initialization', async () => {
            const result = await database.initializeDatabase();

            expect(result).toBe(mockPool);
        });

        test('should return existing pool if already initialized', async () => {
            const firstResult = await database.initializeDatabase();
            mockPool.getConnection.mockClear();

            const secondResult = await database.initializeDatabase();

            // Should not test connection again
            expect(mockPool.getConnection).not.toHaveBeenCalled();
            expect(secondResult).toBe(firstResult);
        });

        test('should handle connection errors', async () => {
            const connectionError = new Error('Connection failed');
            mockPool.getConnection.mockRejectedValue(connectionError);

            await expect(database.initializeDatabase()).rejects.toThrow('Connection failed');
            expect(console.error).toHaveBeenCalledWith('✗ MySQL connection error:', 'Connection failed');
        });

        test('should throw error if connection test fails', async () => {
            mockPool.getConnection.mockRejectedValue(new Error('Invalid configuration'));

            await expect(database.initializeDatabase()).rejects.toThrow('Invalid configuration');
        });
    });

    describe('getDb()', () => {
        test('should return pool after initialization', async () => {
            await database.initializeDatabase();

            const result = database.getDb();

            expect(result).toBe(mockPool);
        });

        test('should throw error if called before initialization', () => {
            expect(() => {
                database.getDb();
            }).toThrow('Database not initialized. Call initializeDatabase() first.');
        });

        test('should return same pool on multiple calls', async () => {
            await database.initializeDatabase();

            const result1 = database.getDb();
            const result2 = database.getDb();

            expect(result1).toBe(result2);
            expect(result1).toBe(mockPool);
        });
    });

    describe('closeDatabase()', () => {
        test('should close pool connection', async () => {
            await database.initializeDatabase();
            await database.closeDatabase();

            expect(mockPool.end).toHaveBeenCalled();
        });

        test('should log success message', async () => {
            await database.initializeDatabase();
            await database.closeDatabase();

            expect(console.log).toHaveBeenCalledWith('✓ MySQL database connection closed');
        });

        test('should handle closing when not initialized', async () => {
            await database.closeDatabase();

            expect(mockPool.end).not.toHaveBeenCalled();
        });

        test('should reset pool to null after closing', async () => {
            await database.initializeDatabase();
            await database.closeDatabase();

            expect(() => {
                database.getDb();
            }).toThrow('Database not initialized');
        });

        test('should allow re-initialization after close', async () => {
            await database.initializeDatabase();
            await database.closeDatabase();

            // Re-initialize should work
            const result = await database.initializeDatabase();

            expect(result).toBeDefined();
            expect(result.getConnection).toBeDefined();
        });
    });

    describe('Singleton pattern behavior', () => {
        test('should maintain single pool instance', async () => {
            const pool1 = await database.initializeDatabase();
            const pool2 = await database.initializeDatabase();
            const pool3 = database.getDb();

            expect(pool1).toBe(pool2);
            expect(pool2).toBe(pool3);
            expect(pool1).toBe(mockPool);
        });

        test('should reset pool after close', async () => {
            await database.initializeDatabase();
            const poolBeforeClose = database.getDb();

            await database.closeDatabase();

            expect(() => database.getDb()).toThrow('Database not initialized');
        });
    });

    describe('Error handling', () => {
        test('should handle network connection errors', async () => {
            mockPool.getConnection.mockRejectedValue(new Error('ECONNREFUSED'));

            await expect(database.initializeDatabase()).rejects.toThrow('ECONNREFUSED');
        });

        test('should handle authentication errors', async () => {
            mockPool.getConnection.mockRejectedValue(new Error('Access denied'));

            await expect(database.initializeDatabase()).rejects.toThrow('Access denied');
        });

        test('should handle database not found errors', async () => {
            mockPool.getConnection.mockRejectedValue(new Error('Unknown database'));

            await expect(database.initializeDatabase()).rejects.toThrow('Unknown database');
        });

        test('should handle pool.end() errors', async () => {
            await database.initializeDatabase();

            // Mock end to throw error for this specific test
            const originalEnd = mockPool.end;
            mockPool.end = jest.fn().mockRejectedValue(new Error('Close error'));

            await expect(database.closeDatabase()).rejects.toThrow('Close error');

            // Restore original mock for afterEach cleanup
            mockPool.end = originalEnd;
        });
    });
});
