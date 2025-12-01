/**
 * Unit Tests - Error Handler Middleware
 * Tests for centralized error handling
 */

const { createMockRequest, createMockResponse, createMockNext } = require('../../helpers/mocks');

// Mock logger
jest.mock('../../../utils/logger');

const errorHandler = require('../../../middleware/errorHandler');

describe('Error Handler Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        next = createMockNext();
        process.env.NODE_ENV = 'test';
    });

    describe('AppError', () => {
        test('should create error with custom status code', () => {
            const error = new errorHandler.AppError('Test error', 400);

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.isOperational).toBe(true);
        });

        test('should default to 500 status code', () => {
            const error = new errorHandler.AppError('Test error');

            expect(error.statusCode).toBe(500);
        });

        test('should mark as operational by default', () => {
            const error = new errorHandler.AppError('Test error', 500);

            expect(error.isOperational).toBe(true);
        });

        test('should allow non-operational errors', () => {
            const error = new errorHandler.AppError('Test error', 500, false);

            expect(error.isOperational).toBe(false);
        });
    });

    describe('Error creator functions', () => {
        test('badRequest should create 400 error', () => {
            const error = errorHandler.badRequest('Bad request');

            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Bad request');
            expect(error.isOperational).toBe(true);
        });

        test('unauthorized should create 401 error', () => {
            const error = errorHandler.unauthorized();

            expect(error.statusCode).toBe(401);
            expect(error.isOperational).toBe(true);
        });

        test('forbidden should create 403 error', () => {
            const error = errorHandler.forbidden();

            expect(error.statusCode).toBe(403);
            expect(error.isOperational).toBe(true);
        });

        test('notFound should create 404 error', () => {
            const error = errorHandler.notFound();

            expect(error.statusCode).toBe(404);
            expect(error.isOperational).toBe(true);
        });

        test('conflict should create 409 error', () => {
            const error = errorHandler.conflict();

            expect(error.statusCode).toBe(409);
            expect(error.isOperational).toBe(true);
        });

        test('internalError should create 500 error marked as non-operational', () => {
            const error = errorHandler.internalError();

            expect(error.statusCode).toBe(500);
            expect(error.isOperational).toBe(false);
        });
    });

    describe('handleDatabaseError', () => {
        test('should handle duplicate entry error', () => {
            const err = { code: 'ER_DUP_ENTRY' };
            const result = errorHandler.handleDatabaseError(err);

            expect(result.statusCode).toBe(409);
            expect(result.isOperational).toBe(true);
        });

        test('should handle foreign key constraint errors', () => {
            const err = { code: 'ER_NO_REFERENCED_ROW_2' };
            const result = errorHandler.handleDatabaseError(err);

            expect(result.statusCode).toBe(400);
            expect(result.isOperational).toBe(true);
        });

        test('should handle connection refused error', () => {
            const err = { code: 'ECONNREFUSED' };
            const result = errorHandler.handleDatabaseError(err);

            expect(result.statusCode).toBe(503);
            expect(result.isOperational).toBe(false);
        });

        test('should handle timeout error', () => {
            const err = { code: 'ETIMEDOUT' };
            const result = errorHandler.handleDatabaseError(err);

            expect(result.statusCode).toBe(504);
            expect(result.isOperational).toBe(true);
        });

        test('should return generic error for unknown database errors', () => {
            const err = { code: 'ER_UNKNOWN' };
            const result = errorHandler.handleDatabaseError(err);

            expect(result.statusCode).toBe(500);
            expect(result.isOperational).toBe(false);
        });
    });

    describe('handleValidationError', () => {
        test('should format validation errors', () => {
            const validationErrors = {
                email: 'Invalid email',
                phone: 'Invalid phone'
            };

            const result = errorHandler.handleValidationError(validationErrors);

            expect(result.statusCode).toBe(400);
            expect(result.errors).toEqual(validationErrors);
            expect(result.isOperational).toBe(true);
        });
    });

    describe('handleJsonError', () => {
        test('should return 400 for JSON parsing errors', () => {
            const err = new SyntaxError('Unexpected token');
            const result = errorHandler.handleJsonError(err);

            expect(result.statusCode).toBe(400);
            expect(result.isOperational).toBe(true);
        });
    });

    describe('errorHandler middleware', () => {
        test('should handle AppError correctly', () => {
            const err = new errorHandler.AppError('Test error', 400);

            errorHandler.errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Test error'
            });
        });

        test('should handle database errors', () => {
            const err = { code: 'ER_DUP_ENTRY', message: 'Duplicate entry' };

            errorHandler.errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: expect.any(String)
            });
        });

        test('should handle JSON parsing errors', () => {
            const err = new SyntaxError('Unexpected token');
            err.status = 400;
            err.body = '{}';

            errorHandler.errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should include validation errors in response', () => {
            const err = {
                name: 'ValidationError',
                errors: {
                    email: 'Invalid email',
                    phone: 'Invalid phone'
                }
            };

            errorHandler.errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: expect.any(String),
                errors: err.errors
            });
        });

        test('should include stack trace in development for non-operational errors', () => {
            process.env.NODE_ENV = 'development';
            const err = new Error('Unexpected error');
            err.stack = 'Error stack trace';

            errorHandler.errorHandler(err, req, res, next);

            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.stack).toBeDefined();
        });

        test('should not include stack trace in production', () => {
            process.env.NODE_ENV = 'production';
            const err = new Error('Unexpected error');
            err.stack = 'Error stack trace';

            errorHandler.errorHandler(err, req, res, next);

            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.stack).toBeUndefined();
        });

        test('should default to 500 status code for unknown errors', () => {
            const err = new Error('Unknown error');

            errorHandler.errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('notFoundHandler', () => {
        test('should create 404 error and pass to next', () => {
            req.originalUrl = '/nonexistent-page';

            errorHandler.notFoundHandler(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    isOperational: true
                })
            );
        });
    });

    describe('asyncHandler', () => {
        test('should handle successful async function', async () => {
            const asyncFn = async (req, res, next) => {
                res.json({ success: true });
            };

            const wrappedFn = errorHandler.asyncHandler(asyncFn);
            await wrappedFn(req, res, next);

            expect(res.json).toHaveBeenCalledWith({ success: true });
            expect(next).not.toHaveBeenCalled();
        });

        test('should catch errors from async function', async () => {
            const error = new Error('Async error');
            const asyncFn = async (req, res, next) => {
                throw error;
            };

            const wrappedFn = errorHandler.asyncHandler(asyncFn);
            await wrappedFn(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
