/**
 * Test Express App Setup
 * Creates a properly configured Express app for integration testing
 */

const express = require('express');
const session = require('express-session');

/**
 * Create a test Express application with all necessary middleware
 * @returns {Express.Application}
 */
function createTestApp() {
  const app = express();

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session middleware (required for some routes)
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  // Mount API routes
  app.use('/api/appointments', require('../../routes/api/appointments'));
  app.use('/api/availability', require('../../routes/api/availability'));
  app.use('/api/admin', require('../../routes/admin/auth'));
  app.use('/api/admin/appointments', require('../../routes/admin/appointments'));
  app.use('/api/admin/availability', require('../../routes/admin/availability'));

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Test app error:', err);
    res.status(err.statusCode || err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
}

module.exports = { createTestApp };
