/**
 * Unit Tests - Setup Check Middleware
 * Tests for admin setup status checking and routing
 */

// Mock database BEFORE any imports
jest.mock('../../../services/database', () => ({
    getDb: jest.fn()
}));

const { getDb } = require('../../../services/database');
const {
    isSetupRequired,
    requireSetupComplete,
    requireSetupIncomplete
} = require('../../../middleware/setupCheck');

describe('Setup Check Middleware', () => {
    let mockDb;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock database
        mockDb = {
            query: jest.fn()
        };
        getDb.mockReturnValue(mockDb);

        // Mock Express objects
        mockReq = {
            path: '/admin/dashboard.html'
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            redirect: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        // Mock console to avoid test output noise
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('isSetupRequired()', () => {
        test('should return true when no admin users exist', async () => {
            mockDb.query.mockResolvedValue([[{ count: 0 }]]);

            const result = await isSetupRequired();

            expect(result).toBe(true);
            expect(mockDb.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM admin_users');
        });

        test('should return false when admin users exist', async () => {
            mockDb.query.mockResolvedValue([[{ count: 1 }]]);

            const result = await isSetupRequired();

            expect(result).toBe(false);
            expect(mockDb.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM admin_users');
        });

        test('should return false on database error', async () => {
            mockDb.query.mockRejectedValue(new Error('Database error'));

            const result = await isSetupRequired();

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error checking setup status:', expect.any(Error));
        });
    });

    describe('requireSetupComplete()', () => {
        test('should call next() when setup is complete', async () => {
            mockDb.query.mockResolvedValue([[{ count: 1 }]]);

            await requireSetupComplete(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.redirect).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should allow access to setup page when setup required', async () => {
            mockDb.query.mockResolvedValue([[{ count: 0 }]]);
            mockReq.path = '/admin/setup.html';

            await requireSetupComplete(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.redirect).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should allow access to setup API when setup required', async () => {
            mockDb.query.mockResolvedValue([[{ count: 0 }]]);
            mockReq.path = '/api/admin/setup/create';

            await requireSetupComplete(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.redirect).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should return 503 JSON for API requests when setup required', async () => {
            mockDb.query.mockResolvedValue([[{ count: 0 }]]);
            mockReq.path = '/api/admin/dashboard';

            await requireSetupComplete(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(503);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Απαιτείται αρχική ρύθμιση του συστήματος.',
                setupRequired: true
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('should redirect to setup page for HTML requests when setup required', async () => {
            mockDb.query.mockResolvedValue([[{ count: 0 }]]);
            mockReq.path = '/admin/dashboard.html';

            await requireSetupComplete(mockReq, mockRes, mockNext);

            expect(mockRes.redirect).toHaveBeenCalledWith('/admin/setup.html');
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireSetupIncomplete()', () => {
        test('should call next() when setup is required', async () => {
            mockDb.query.mockResolvedValue([[{ count: 0 }]]);

            await requireSetupIncomplete(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.redirect).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('should return 400 JSON for API requests when setup complete', async () => {
            mockDb.query.mockResolvedValue([[{ count: 1 }]]);
            mockReq.path = '/api/admin/setup/create';

            await requireSetupIncomplete(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Η αρχική ρύθμιση έχει ήδη ολοκληρωθεί.'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('should redirect to login for HTML requests when setup complete', async () => {
            mockDb.query.mockResolvedValue([[{ count: 1 }]]);
            mockReq.path = '/admin/setup.html';

            await requireSetupIncomplete(mockReq, mockRes, mockNext);

            expect(mockRes.redirect).toHaveBeenCalledWith('/admin/login.html');
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
