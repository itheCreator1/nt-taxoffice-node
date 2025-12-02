/**
 * Unit Tests - Logger Utility
 * Tests for logging functionality
 */

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('Logger Utility', () => {
    let logger;
    let mockConsoleLog;
    let mockConsoleError;
    let mockConsoleWarn;

    beforeEach(() => {
        // Clear module cache to get fresh instance
        jest.resetModules();

        // Mock console methods
        mockConsoleLog = jest.fn();
        mockConsoleError = jest.fn();
        mockConsoleWarn = jest.fn();

        console.log = mockConsoleLog;
        console.error = mockConsoleError;
        console.warn = mockConsoleWarn;

        // Set log level to DEBUG for testing
        process.env.LOG_LEVEL = 'DEBUG';

        // Load logger
        logger = require('../../../utils/logger');
    });

    afterEach(() => {
        // Restore console
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;

        delete process.env.LOG_LEVEL;
    });

    describe('Basic logging functions', () => {
        test('should log error messages', () => {
            logger.error('Test error message');

            expect(mockConsoleError).toHaveBeenCalled();
            const logOutput = mockConsoleError.mock.calls[0][0];
            expect(logOutput).toContain('ERROR');
            expect(logOutput).toContain('Test error message');
        });

        test('should log error with Error object', () => {
            const error = new Error('Something went wrong');
            logger.error('Test error', error);

            expect(mockConsoleError).toHaveBeenCalled();
            const logOutput = mockConsoleError.mock.calls[0][0];
            expect(logOutput).toContain('ERROR');
            expect(logOutput).toContain('Test error');
            expect(logOutput).toContain('Something went wrong');
        });

        test('should log error with metadata object', () => {
            logger.error('Test error', { userId: 123, action: 'delete' });

            expect(mockConsoleError).toHaveBeenCalled();
            const logOutput = mockConsoleError.mock.calls[0][0];
            expect(logOutput).toContain('userId');
            expect(logOutput).toContain('123');
        });

        test('should log warning messages', () => {
            logger.warn('Test warning message');

            expect(mockConsoleWarn).toHaveBeenCalled();
            const logOutput = mockConsoleWarn.mock.calls[0][0];
            expect(logOutput).toContain('WARN');
            expect(logOutput).toContain('Test warning message');
        });

        test('should log warning with metadata', () => {
            logger.warn('Test warning', { reason: 'timeout' });

            expect(mockConsoleWarn).toHaveBeenCalled();
            const logOutput = mockConsoleWarn.mock.calls[0][0];
            expect(logOutput).toContain('reason');
            expect(logOutput).toContain('timeout');
        });

        test('should log info messages', () => {
            logger.info('Test info message');

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('INFO');
            expect(logOutput).toContain('Test info message');
        });

        test('should log info with metadata', () => {
            logger.info('Test info', { count: 42 });

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('count');
            expect(logOutput).toContain('42');
        });

        test('should log debug messages', () => {
            logger.debug('Test debug message');

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('DEBUG');
            expect(logOutput).toContain('Test debug message');
        });

        test('should log debug with metadata', () => {
            logger.debug('Test debug', { details: 'verbose' });

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('details');
            expect(logOutput).toContain('verbose');
        });
    });

    describe('Log level filtering', () => {
        test('should respect ERROR log level', () => {
            jest.resetModules();
            process.env.LOG_LEVEL = 'ERROR';
            logger = require('../../../utils/logger');

            logger.error('Error message');
            logger.warn('Warning message');
            logger.info('Info message');
            logger.debug('Debug message');

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            expect(mockConsoleWarn).not.toHaveBeenCalled();
            expect(mockConsoleLog).not.toHaveBeenCalled();
        });

        test('should respect WARN log level', () => {
            jest.resetModules();
            process.env.LOG_LEVEL = 'WARN';
            logger = require('../../../utils/logger');

            logger.error('Error message');
            logger.warn('Warning message');
            logger.info('Info message');
            logger.debug('Debug message');

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
            expect(mockConsoleLog).not.toHaveBeenCalled();
        });

        test('should respect INFO log level', () => {
            jest.resetModules();
            process.env.LOG_LEVEL = 'INFO';
            logger = require('../../../utils/logger');

            logger.error('Error message');
            logger.warn('Warning message');
            logger.info('Info message');
            logger.debug('Debug message');

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
            expect(mockConsoleLog).toHaveBeenCalledTimes(1);
        });

        test('should respect DEBUG log level', () => {
            jest.resetModules();
            process.env.LOG_LEVEL = 'DEBUG';
            logger = require('../../../utils/logger');

            logger.error('Error message');
            logger.warn('Warning message');
            logger.info('Info message');
            logger.debug('Debug message');

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
            expect(mockConsoleLog).toHaveBeenCalledTimes(2);
        });

        test('should default to INFO level when not specified', () => {
            jest.resetModules();
            delete process.env.LOG_LEVEL;
            logger = require('../../../utils/logger');

            logger.debug('Debug message');
            logger.info('Info message');

            expect(mockConsoleLog).toHaveBeenCalledTimes(1);
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('INFO');
        });
    });

    describe('Specialized logging functions', () => {
        test('should log HTTP requests', () => {
            const mockReq = {
                method: 'GET',
                path: '/api/test',
                ip: '127.0.0.1',
                get: jest.fn(() => 'Mozilla/5.0')
            };

            logger.logRequest(mockReq);

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('HTTP Request');
            expect(logOutput).toContain('GET');
            expect(logOutput).toContain('/api/test');
        });

        test('should log HTTP responses with correct level', () => {
            const mockReq = {
                method: 'GET',
                path: '/api/test'
            };
            const mockRes = {
                statusCode: 200
            };

            logger.logResponse(mockReq, mockRes, 150);

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('HTTP Response');
            expect(logOutput).toContain('200');
            expect(logOutput).toContain('150ms');
        });

        test('should log 4xx responses as warnings', () => {
            const mockReq = {
                method: 'POST',
                path: '/api/test'
            };
            const mockRes = {
                statusCode: 404
            };

            logger.logResponse(mockReq, mockRes, 50);

            expect(mockConsoleWarn).toHaveBeenCalled();
            const logOutput = mockConsoleWarn.mock.calls[0][0];
            expect(logOutput).toContain('404');
        });

        test('should log 5xx responses as errors', () => {
            const mockReq = {
                method: 'POST',
                path: '/api/test'
            };
            const mockRes = {
                statusCode: 500
            };

            logger.logResponse(mockReq, mockRes, 200);

            expect(mockConsoleError).toHaveBeenCalled();
            const logOutput = mockConsoleError.mock.calls[0][0];
            expect(logOutput).toContain('500');
        });

        test('should log database queries', () => {
            logger.logQuery('SELECT * FROM users WHERE id = ?', [123]);

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('Database Query');
            expect(logOutput).toContain('SELECT * FROM users');
        });

        test('should log successful email sending', () => {
            logger.logEmail('test@example.com', 'Test Subject', true);

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('Email Sent');
            expect(logOutput).toContain('test@example.com');
            expect(logOutput).toContain('sent');
        });

        test('should log failed email sending', () => {
            logger.logEmail('test@example.com', 'Test Subject', false);

            expect(mockConsoleError).toHaveBeenCalled();
            const logOutput = mockConsoleError.mock.calls[0][0];
            expect(logOutput).toContain('Email Failed');
            expect(logOutput).toContain('failed');
        });

        test('should log appointment creation', () => {
            logger.logAppointmentCreated('John Doe', '2025-12-15', '10:00');

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('Appointment Created');
            expect(logOutput).toContain('John Doe');
            expect(logOutput).toContain('2025-12-15');
        });

        test('should log appointment status changes', () => {
            logger.logAppointmentStatusChange(123, 'pending', 'confirmed', 'admin');

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('Appointment Status Changed');
            expect(logOutput).toContain('pending');
            expect(logOutput).toContain('confirmed');
            expect(logOutput).toContain('admin');
        });

        test('should log successful admin login', () => {
            logger.logAdminLogin('admin', true);

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('Admin Login Successful');
            expect(logOutput).toContain('admin');
        });

        test('should log failed admin login', () => {
            logger.logAdminLogin('admin', false);

            expect(mockConsoleWarn).toHaveBeenCalled();
            const logOutput = mockConsoleWarn.mock.calls[0][0];
            expect(logOutput).toContain('Admin Login Failed');
        });

        test('should log security events', () => {
            logger.logSecurityEvent('Rate limit exceeded', { ip: '192.168.1.1' });

            expect(mockConsoleWarn).toHaveBeenCalled();
            const logOutput = mockConsoleWarn.mock.calls[0][0];
            expect(logOutput).toContain('Security Event');
            expect(logOutput).toContain('Rate limit exceeded');
            expect(logOutput).toContain('192.168.1.1');
        });
    });

    describe('Request logger middleware', () => {
        test('should create middleware function', () => {
            const middleware = logger.requestLoggerMiddleware();

            expect(typeof middleware).toBe('function');
            expect(middleware.length).toBe(3); // req, res, next
        });

        test('should log request and call next', () => {
            const middleware = logger.requestLoggerMiddleware();
            const mockReq = {
                method: 'GET',
                path: '/test',
                ip: '127.0.0.1',
                get: jest.fn(() => 'Mozilla/5.0')
            };
            const mockRes = {
                on: jest.fn()
            };
            const mockNext = jest.fn();

            middleware(mockReq, mockRes, mockNext);

            expect(mockConsoleLog).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
        });

        test('should log response when finished', () => {
            const middleware = logger.requestLoggerMiddleware();
            const mockReq = {
                method: 'GET',
                path: '/test',
                ip: '127.0.0.1',
                get: jest.fn(() => 'Mozilla/5.0')
            };
            let finishCallback;
            const mockRes = {
                statusCode: 200,
                on: jest.fn((event, callback) => {
                    if (event === 'finish') {
                        finishCallback = callback;
                    }
                })
            };
            const mockNext = jest.fn();

            middleware(mockReq, mockRes, mockNext);

            // Clear previous calls
            mockConsoleLog.mockClear();

            // Trigger finish event
            finishCallback();

            expect(mockConsoleLog).toHaveBeenCalled();
            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('HTTP Response');
            expect(logOutput).toContain('200');
        });
    });

    describe('Log message formatting', () => {
        test('should include timestamp in log messages', () => {
            logger.info('Test message');

            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toMatch(/\[\d{2}\/\d{2}\/\d{4}/); // Date format
        });

        test('should include log level in messages', () => {
            logger.info('Test message');

            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('[INFO]');
        });

        test('should format metadata as JSON', () => {
            logger.info('Test', { key: 'value', number: 42 });

            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('"key":"value"');
            expect(logOutput).toContain('"number":42');
        });

        test('should handle empty metadata', () => {
            logger.info('Test message', {});

            const logOutput = mockConsoleLog.mock.calls[0][0];
            expect(logOutput).toContain('Test message');
            expect(logOutput).not.toContain('{}');
        });
    });

    describe('LOG_LEVELS export', () => {
        test('should export LOG_LEVELS object', () => {
            expect(logger.LOG_LEVELS).toBeDefined();
            expect(logger.LOG_LEVELS.ERROR).toBe(0);
            expect(logger.LOG_LEVELS.WARN).toBe(1);
            expect(logger.LOG_LEVELS.INFO).toBe(2);
            expect(logger.LOG_LEVELS.DEBUG).toBe(3);
        });
    });
});
