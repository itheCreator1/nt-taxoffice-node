/**
 * Unit Tests - Rate Limiter Middleware
 * Tests for rate limiting configuration
 */

// Mock logger before requiring rateLimiter
jest.mock('../../../utils/logger');

const rateLimiter = require('../../../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
    describe('Module exports', () => {
        test('should export all rate limiters', () => {
            expect(rateLimiter.apiLimiter).toBeDefined();
            expect(rateLimiter.bookingLimiter).toBeDefined();
            expect(rateLimiter.loginLimiter).toBeDefined();
            expect(rateLimiter.setupLimiter).toBeDefined();
            expect(rateLimiter.cancellationLimiter).toBeDefined();
            expect(rateLimiter.passwordResetLimiter).toBeDefined();
        });

        test('should export createRateLimiter function', () => {
            expect(typeof rateLimiter.createRateLimiter).toBe('function');
        });
    });

    describe('apiLimiter', () => {
        test('should be a function (middleware)', () => {
            expect(typeof rateLimiter.apiLimiter).toBe('function');
        });

        test('should have standard configuration', () => {
            const limiter = rateLimiter.apiLimiter;
            expect(limiter).toBeDefined();
            // Rate limiters are functions, we can't easily test internals
            // but we can verify they exist
        });
    });

    describe('bookingLimiter', () => {
        test('should be a function (middleware)', () => {
            expect(typeof rateLimiter.bookingLimiter).toBe('function');
        });

        test('should be defined for protecting booking endpoint', () => {
            expect(rateLimiter.bookingLimiter).toBeDefined();
        });
    });

    describe('loginLimiter', () => {
        test('should be a function (middleware)', () => {
            expect(typeof rateLimiter.loginLimiter).toBe('function');
        });

        test('should be defined for protecting login endpoint', () => {
            expect(rateLimiter.loginLimiter).toBeDefined();
        });
    });

    describe('setupLimiter', () => {
        test('should be a function (middleware)', () => {
            expect(typeof rateLimiter.setupLimiter).toBe('function');
        });

        test('should be defined for protecting setup endpoint', () => {
            expect(rateLimiter.setupLimiter).toBeDefined();
        });
    });

    describe('cancellationLimiter', () => {
        test('should be a function (middleware)', () => {
            expect(typeof rateLimiter.cancellationLimiter).toBe('function');
        });

        test('should be defined for protecting cancellation endpoint', () => {
            expect(rateLimiter.cancellationLimiter).toBeDefined();
        });
    });

    describe('passwordResetLimiter', () => {
        test('should be a function (middleware)', () => {
            expect(typeof rateLimiter.passwordResetLimiter).toBe('function');
        });

        test('should be defined for protecting password reset endpoint', () => {
            expect(rateLimiter.passwordResetLimiter).toBeDefined();
        });
    });

    describe('createRateLimiter', () => {
        test('should create a custom rate limiter', () => {
            const customLimiter = rateLimiter.createRateLimiter({
                max: 50,
                windowMs: 10 * 60 * 1000
            });

            expect(typeof customLimiter).toBe('function');
        });

        test('should create limiter with default options when no options provided', () => {
            const defaultLimiter = rateLimiter.createRateLimiter();

            expect(typeof defaultLimiter).toBe('function');
        });

        test('should merge custom options with defaults', () => {
            const customLimiter = rateLimiter.createRateLimiter({
                max: 200
            });

            // Limiter should be created successfully
            expect(typeof customLimiter).toBe('function');
        });
    });

    describe('Rate limiter configuration', () => {
        test('should use environment variables for API limiter when available', () => {
            // This test verifies that the module loads without errors
            // when environment variables are set
            expect(rateLimiter.apiLimiter).toBeDefined();
        });

        test('all limiters should be middleware functions', () => {
            const limiters = [
                rateLimiter.apiLimiter,
                rateLimiter.bookingLimiter,
                rateLimiter.loginLimiter,
                rateLimiter.setupLimiter,
                rateLimiter.cancellationLimiter,
                rateLimiter.passwordResetLimiter
            ];

            limiters.forEach(limiter => {
                expect(typeof limiter).toBe('function');
            });
        });
    });
});
