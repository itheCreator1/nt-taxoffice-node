/**
 * Unit Tests - Auth Middleware
 * Tests for authentication and authorization middleware
 */

const { createMockRequest, createMockResponse, createMockNext, createMockDbPool } = require('../../helpers/mocks');

// Mock dependencies
jest.mock('../../../services/database');
jest.mock('../../../utils/logger');

const database = require('../../../services/database');
const auth = require('../../../middleware/auth');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
    });

    describe('requireAuth', () => {
        test('should call next() if user is authenticated', () => {
            req.session = { adminId: 1 };

            auth.requireAuth(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('should return 401 JSON for unauthenticated API requests', () => {
            req.session = {};
            req.path = '/api/admin/appointments';
            req.originalUrl = '/api/admin/appointments';

            auth.requireAuth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: expect.any(String)
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should redirect to login for unauthenticated page requests', () => {
            req.session = {};
            req.path = '/admin/dashboard.html';
            req.originalUrl = '/admin/dashboard.html';

            auth.requireAuth(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith(
                expect.stringContaining('/admin/login.html?redirect=')
            );
            expect(next).not.toHaveBeenCalled();
        });

        test('should handle missing session', () => {
            req.session = null;
            req.path = '/api/admin/test';
            req.originalUrl = '/api/admin/test';

            auth.requireAuth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        test('should handle missing adminId in session', () => {
            req.session = { someOtherData: 'value' };
            req.path = '/api/admin/test';
            req.originalUrl = '/api/admin/test';

            auth.requireAuth(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('requireGuest', () => {
        test('should call next() if user is not authenticated', () => {
            req.session = {};

            auth.requireGuest(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('should redirect to dashboard if user is authenticated', () => {
            req.session = { adminId: 1 };

            auth.requireGuest(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard.html');
            expect(next).not.toHaveBeenCalled();
        });

        test('should handle null session', () => {
            req.session = null;

            auth.requireGuest(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('attachAdminUser', () => {
        let mockPool;

        beforeEach(() => {
            mockPool = createMockDbPool();
            database.getDb.mockReturnValue(mockPool);
        });

        test('should attach admin user data if authenticated', async () => {
            req.session = { adminId: 1 };

            const mockAdmin = {
                id: 1,
                username: 'testadmin',
                email: 'admin@example.com',
                created_at: new Date()
            };

            mockPool.query.mockResolvedValueOnce([[mockAdmin]]);

            await auth.attachAdminUser(req, res, next);

            expect(req.admin).toEqual(mockAdmin);
            expect(next).toHaveBeenCalled();
        });

        test('should call next() even if user not found', async () => {
            req.session = { adminId: 999 };
            mockPool.query.mockResolvedValueOnce([[]]);

            await auth.attachAdminUser(req, res, next);

            expect(req.admin).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });

        test('should handle database errors gracefully', async () => {
            req.session = { adminId: 1 };
            mockPool.query.mockRejectedValueOnce(new Error('Database error'));

            await auth.attachAdminUser(req, res, next);

            expect(req.admin).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });

        test('should call next() if no session', async () => {
            req.session = null;

            await auth.attachAdminUser(req, res, next);

            expect(req.admin).toBeUndefined();
            expect(mockPool.query).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });

        test('should call next() if no adminId in session', async () => {
            req.session = {};

            await auth.attachAdminUser(req, res, next);

            expect(req.admin).toBeUndefined();
            expect(mockPool.query).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        test('should destroy session and return success for API requests', () => {
            req.path = '/api/admin/logout';
            req.session = {
                adminId: 1,
                destroy: jest.fn((callback) => callback(null))
            };

            auth.logout(req, res);

            expect(req.session.destroy).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: expect.any(String)
            });
        });

        test('should destroy session and redirect for page requests', () => {
            req.path = '/admin/logout';
            req.session = {
                adminId: 1,
                destroy: jest.fn((callback) => callback(null))
            };

            auth.logout(req, res);

            expect(req.session.destroy).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith('/admin/login.html');
        });

        test('should handle session destroy errors', () => {
            req.path = '/api/admin/logout';
            req.session = {
                adminId: 1,
                destroy: jest.fn((callback) => callback(new Error('Session error')))
            };

            auth.logout(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: expect.any(String)
            });
        });

    });
});
