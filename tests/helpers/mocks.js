/**
 * Test Mocks
 * Mock implementations for external dependencies
 */

/**
 * Mock Nodemailer transporter
 * @returns {object}
 */
function createMockEmailTransporter() {
    return {
        sendMail: jest.fn().mockResolvedValue({
            messageId: 'test-message-id',
            accepted: ['test@example.com'],
            rejected: [],
            response: '250 Message accepted'
        }),
        verify: jest.fn().mockResolvedValue(true)
    };
}

/**
 * Mock database connection
 * @returns {object}
 */
function createMockDbConnection() {
    return {
        query: jest.fn(),
        execute: jest.fn(),
        beginTransaction: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn()
    };
}

/**
 * Mock database pool
 * @returns {object}
 */
function createMockDbPool() {
    const mockConnection = createMockDbConnection();

    return {
        getConnection: jest.fn().mockResolvedValue(mockConnection),
        query: jest.fn(),
        execute: jest.fn(),
        end: jest.fn().mockResolvedValue(),
        _mockConnection: mockConnection // For test assertions
    };
}

/**
 * Mock Express request object
 * @param {object} options
 * @returns {object}
 */
function createMockRequest(options = {}) {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        session: {},
        ip: '127.0.0.1',
        ...options
    };
}

/**
 * Mock Express response object
 * @returns {object}
 */
function createMockResponse() {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        render: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis()
    };
    return res;
}

/**
 * Mock Express next function
 * @returns {jest.Mock}
 */
function createMockNext() {
    return jest.fn();
}

/**
 * Mock logger functions
 * @returns {object}
 */
function createMockLogger() {
    return {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        logEmail: jest.fn(),
        logAppointmentCreated: jest.fn(),
        logAppointmentStatusChange: jest.fn()
    };
}

/**
 * Mock session object
 * @param {object} data
 * @returns {object}
 */
function createMockSession(data = {}) {
    return {
        save: jest.fn((callback) => callback && callback()),
        destroy: jest.fn((callback) => callback && callback()),
        regenerate: jest.fn((callback) => callback && callback()),
        reload: jest.fn((callback) => callback && callback()),
        ...data
    };
}

/**
 * Reset all mocks
 */
function resetAllMocks() {
    jest.clearAllMocks();
}

module.exports = {
    createMockEmailTransporter,
    createMockDbConnection,
    createMockDbPool,
    createMockRequest,
    createMockResponse,
    createMockNext,
    createMockLogger,
    createMockSession,
    resetAllMocks
};
