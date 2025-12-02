/**
 * Rate Limiter Middleware
 * Protects API endpoints from abuse using express-rate-limit
 */

const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../utils/logger');

/**
 * General API rate limiter
 * Limits requests from the same IP
 */
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
    skip: () => process.env.NODE_ENV === 'test', // Disable in test environment
    message: {
        success: false,
        message: 'Πάρα πολλές αιτήσεις από αυτή τη διεύθυνση IP. Παρακαλώ δοκιμάστε ξανά αργότερα.'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        logSecurityEvent('Rate Limit Exceeded', {
            ip: req.ip || req.connection?.remoteAddress,
            path: req.path,
            method: req.method
        });

        res.status(429).json({
            success: false,
            message: 'Πάρα πολλές αιτήσεις από αυτή τη διεύθυνση IP. Παρακαλώ δοκιμάστε ξανά αργότερα.'
        });
    }
});

/**
 * Strict rate limiter for appointment bookings
 * Prevents spam bookings
 */
const bookingLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // 5 booking attempts per hour
    skip: () => process.env.NODE_ENV === 'test', // Disable in test environment
    message: {
        success: false,
        message: 'Πάρα πολλές προσπάθειες κράτησης. Παρακαλώ δοκιμάστε ξανά σε 1 ώρα.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests, even successful ones
    handler: (req, res) => {
        logSecurityEvent('Booking Rate Limit Exceeded', {
            ip: req.ip || req.connection?.remoteAddress,
            email: req.body?.client_email
        });

        res.status(429).json({
            success: false,
            message: 'Πάρα πολλές προσπάθειες κράτησης. Παρακαλώ δοκιμάστε ξανά σε 1 ώρα.'
        });
    }
});

/**
 * Strict rate limiter for admin login
 * Prevents brute force attacks
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    skip: () => process.env.NODE_ENV === 'test', // Disable in test environment
    message: {
        success: false,
        message: 'Πάρα πολλές προσπάθειες σύνδεσης. Παρακαλώ δοκιμάστε ξανά σε 15 λεπτά.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    handler: (req, res) => {
        logSecurityEvent('Login Rate Limit Exceeded', {
            ip: req.ip || req.connection?.remoteAddress,
            username: req.body?.username
        });

        res.status(429).json({
            success: false,
            message: 'Πάρα πολλές προσπάθειες σύνδεσης. Παρακαλώ δοκιμάστε ξανά σε 15 λεπτά.'
        });
    }
});

/**
 * Rate limiter for admin setup
 * Very strict to prevent multiple admin creation attempts
 */
const setupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 setup attempts per hour
    skip: () => process.env.NODE_ENV === 'test', // Disable in test environment
    message: {
        success: false,
        message: 'Πάρα πολλές προσπάθειες ρύθμισης. Παρακαλώ δοκιμάστε ξανά αργότερα.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent('Setup Rate Limit Exceeded', {
            ip: req.ip || req.connection?.remoteAddress
        });

        res.status(429).json({
            success: false,
            message: 'Πάρα πολλές προσπάθειες ρύθμισης. Παρακαλώ δοκιμάστε ξανά αργότερα.'
        });
    }
});

/**
 * Rate limiter for appointment cancellation
 * Prevents spam cancellations
 */
const cancellationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 cancellation attempts per 15 minutes
    skip: () => process.env.NODE_ENV === 'test', // Disable in test environment
    message: {
        success: false,
        message: 'Πάρα πολλές προσπάθειες ακύρωσης. Παρακαλώ δοκιμάστε ξανά αργότερα.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent('Cancellation Rate Limit Exceeded', {
            ip: req.ip || req.connection?.remoteAddress
        });

        res.status(429).json({
            success: false,
            message: 'Πάρα πολλές προσπάθειες ακύρωσης. Παρακαλώ δοκιμάστε ξανά αργότερα.'
        });
    }
});

/**
 * Rate limiter for password reset
 * Prevents email flooding
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 reset attempts per hour
    skip: () => process.env.NODE_ENV === 'test', // Disable in test environment
    message: {
        success: false,
        message: 'Πάρα πολλές προσπάθειες επαναφοράς κωδικού. Παρακαλώ δοκιμάστε ξανά σε 1 ώρα.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent('Password Reset Rate Limit Exceeded', {
            ip: req.ip || req.connection?.remoteAddress,
            email: req.body?.email
        });

        res.status(429).json({
            success: false,
            message: 'Πάρα πολλές προσπάθειες επαναφοράς κωδικού. Παρακαλώ δοκιμάστε ξανά σε 1 ώρα.'
        });
    }
});

/**
 * Create custom rate limiter
 * @param {object} options - Rate limiter options
 * @returns {function}
 */
function createRateLimiter(options = {}) {
    const defaults = {
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Πάρα πολλές αιτήσεις. Παρακαλώ δοκιμάστε ξανά αργότερα.'
        }
    };

    return rateLimit({ ...defaults, ...options });
}

module.exports = {
    apiLimiter,
    bookingLimiter,
    loginLimiter,
    setupLimiter,
    cancellationLimiter,
    passwordResetLimiter,
    createRateLimiter
};
