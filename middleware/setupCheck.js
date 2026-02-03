/**
 * Setup Check Middleware
 * Checks if admin user exists and redirects to setup if needed
 */

const { getDb } = require('../services/database');
const { error: logError } = require('../utils/logger');

/**
 * Check if initial setup is required
 * @returns {Promise<boolean>}
 */
async function isSetupRequired() {
  try {
    const db = getDb();
    const [rows] = await db.query('SELECT COUNT(*) as count FROM admin_users');
    return rows[0].count === 0;
  } catch (error) {
    logError('Error checking setup status:', error);
    return false;
  }
}

/**
 * Middleware to redirect to setup if no admin exists
 * Use this on admin routes that require setup to be completed
 */
async function requireSetupComplete(req, res, next) {
  const setupRequired = await isSetupRequired();

  if (setupRequired) {
    // Allow access to setup page itself
    if (req.path === '/admin/setup.html' || req.path.startsWith('/api/admin/setup')) {
      return next();
    }

    // For API requests
    if (req.path.startsWith('/api/')) {
      return res.status(503).json({
        success: false,
        message: 'Απαιτείται αρχική ρύθμιση του συστήματος.',
        setupRequired: true,
      });
    }

    // For page requests, redirect to setup
    return res.redirect('/admin/setup.html');
  }

  return next();
}

/**
 * Middleware to redirect away from setup if it's already complete
 * Use this on the setup page itself
 */
async function requireSetupIncomplete(req, res, next) {
  const setupRequired = await isSetupRequired();

  if (!setupRequired) {
    // Setup is already complete
    // For API requests
    if (req.path.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        message: 'Η αρχική ρύθμιση έχει ήδη ολοκληρωθεί.',
      });
    }

    // For page requests, redirect to login
    return res.redirect('/admin/login.html');
  }

  return next();
}

module.exports = {
  isSetupRequired,
  requireSetupComplete,
  requireSetupIncomplete,
};
