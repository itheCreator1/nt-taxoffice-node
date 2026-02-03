/**
 * Authentication Middleware
 * Protects admin routes and checks user authentication
 */

const { logSecurityEvent, error: logError } = require('../utils/logger');
const { getDb } = require('../services/database');

/**
 * Check if user is authenticated
 * Middleware for protecting admin routes
 */
function requireAuth(req, res, next) {
  // Check if user is logged in via session
  if (!req.session || !req.session.adminId) {
    logSecurityEvent('Unauthorized access attempt', {
      path: req.path,
      ip: req.ip || req.connection?.remoteAddress,
    });

    // For API requests, return JSON error
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        message: 'Απαιτείται έλεγχος ταυτότητας.',
      });
    }

    // For page requests, redirect to login
    return res.redirect(`/admin/login.html?redirect=${encodeURIComponent(req.originalUrl)}`);
  }

  // User is authenticated, continue
  return next();
}

/**
 * Check if user is already authenticated
 * Middleware for login/setup pages to prevent re-authentication
 */
function requireGuest(req, res, next) {
  // If user is already logged in, redirect to dashboard
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard.html');
  }

  // User is not authenticated, continue
  return next();
}

/**
 * Attach admin user info to request
 * Optional middleware to load admin user data
 */
async function attachAdminUser(req, res, next) {
  if (req.session && req.session.adminId) {
    try {
      const db = getDb();

      const [rows] = await db.query(
        'SELECT id, username, email, created_at FROM admin_users WHERE id = ?',
        [req.session.adminId]
      );

      if (rows.length > 0) {
        [req.admin] = rows;
      }
    } catch (error) {
      logError('Error loading admin user:', error);
    }
  }

  return next();
}

/**
 * Logout helper
 * Destroys session and clears admin data
 */
async function logout(req, res) {
  const adminId = req.session?.adminId;

  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (adminId) {
      logSecurityEvent('Admin logout', { adminId });
    }

    // For API requests
    if (req.path.startsWith('/api/')) {
      return res.json({
        success: true,
        message: 'Αποσυνδεθήκατε επιτυχώς.',
      });
    }

    // For page requests
    return res.redirect('/admin/login.html');
  } catch (err) {
    logError('Error destroying session:', err);
    return res.status(500).json({
      success: false,
      message: 'Σφάλμα κατά την αποσύνδεση.',
    });
  }
}

module.exports = {
  requireAuth,
  requireGuest,
  attachAdminUser,
  logout,
};
