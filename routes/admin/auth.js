/**
 * Admin Authentication Routes
 * Handles setup, login, and logout for admin users
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { asyncHandler, badRequest, unauthorized } = require('../../middleware/errorHandler');
const { requireSetupIncomplete } = require('../../middleware/setupCheck');
const { requireGuest, logout } = require('../../middleware/auth');
const { loginLimiter, setupLimiter } = require('../../middleware/rateLimiter');
const { validateAdminCredentials } = require('../../utils/validation');
const { sanitizeAdminCredentials } = require('../../utils/sanitization');
const { logAdminLogin, logSecurityEvent } = require('../../utils/logger');
const { getDb } = require('../../services/database');

/**
 * POST /api/admin/setup
 * Create the first admin user (only works if no admin exists)
 */
router.post('/setup', setupLimiter, requireSetupIncomplete, asyncHandler(async (req, res) => {
    const db = getDb();

    // Sanitize input
    const sanitized = sanitizeAdminCredentials(req.body);

    // Validate input
    const validation = validateAdminCredentials(sanitized);
    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            message: 'Μη έγκυρα δεδομένα.',
            errors: validation.errors
        });
    }

    // Check if admin already exists (double check)
    const [existingAdmins] = await db.query('SELECT COUNT(*) as count FROM admin_users');
    if (existingAdmins[0].count > 0) {
        throw badRequest('Ο διαχειριστής υπάρχει ήδη.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
        sanitized.password,
        parseInt(process.env.BCRYPT_ROUNDS) || 12
    );

    // Create admin user
    const [result] = await db.query(
        `INSERT INTO admin_users (username, email, password_hash)
         VALUES (?, ?, ?)`,
        [sanitized.username, sanitized.email, hashedPassword]
    );

    logSecurityEvent('Admin user created', {
        adminId: result.insertId,
        username: sanitized.username,
        email: sanitized.email
    });

    res.status(201).json({
        success: true,
        message: 'Ο διαχειριστής δημιουργήθηκε επιτυχώς! Μπορείτε τώρα να συνδεθείτε.',
        data: {
            id: result.insertId,
            username: sanitized.username,
            email: sanitized.email
        }
    });
}));

/**
 * POST /api/admin/login
 * Authenticate admin user and create session
 */
router.post('/login', loginLimiter, requireGuest, asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        throw badRequest('Παρακαλώ εισάγετε όνομα χρήστη και κωδικό πρόσβασης.');
    }

    const db = getDb();

    // Find admin user
    const [rows] = await db.query(
        'SELECT id, username, email, password_hash FROM admin_users WHERE username = ?',
        [username]
    );

    if (rows.length === 0) {
        logAdminLogin(username, false);
        throw unauthorized('Λάθος όνομα χρήστη ή κωδικός πρόσβασης.');
    }

    const admin = rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
        logAdminLogin(username, false);
        throw unauthorized('Λάθος όνομα χρήστη ή κωδικός πρόσβασης.');
    }

    // Update last login
    await db.query(
        'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
        [admin.id]
    );

    // Create session
    req.session.adminId = admin.id;
    req.session.username = admin.username;

    logAdminLogin(username, true);

    res.json({
        success: true,
        message: 'Συνδεθήκατε επιτυχώς!',
        data: {
            id: admin.id,
            username: admin.username,
            email: admin.email
        }
    });
}));

/**
 * POST /api/admin/logout
 * Destroy admin session
 */
router.post('/logout', asyncHandler(async (req, res) => {
    logout(req, res);
}));

/**
 * GET /api/admin/me
 * Get current admin user info
 */
router.get('/me', asyncHandler(async (req, res) => {
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({
            success: false,
            message: 'Δεν έχετε συνδεθεί.',
            authenticated: false
        });
    }

    const db = getDb();
    const [rows] = await db.query(
        'SELECT id, username, email, created_at, last_login FROM admin_users WHERE id = ?',
        [req.session.adminId]
    );

    if (rows.length === 0) {
        // Session exists but user doesn't - clear session
        req.session.destroy();
        return res.status(401).json({
            success: false,
            message: 'Ο χρήστης δεν βρέθηκε.',
            authenticated: false
        });
    }

    res.json({
        success: true,
        authenticated: true,
        data: rows[0]
    });
}));

/**
 * GET /api/admin/check-setup
 * Check if initial setup is required
 */
router.get('/check-setup', asyncHandler(async (req, res) => {
    const db = getDb();
    const [rows] = await db.query('SELECT COUNT(*) as count FROM admin_users');
    const setupRequired = rows[0].count === 0;

    res.json({
        success: true,
        setupRequired
    });
}));

module.exports = router;
