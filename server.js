/**
 * NT - TAXOFFICE
 * Main server entry point
 */

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import utilities and middleware
const { initializeDatabase, getDb } = require('./services/database');
const { requestLoggerMiddleware, info, error: logError } = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const indexRoutes = require('./routes/index');
const availabilityRoutes = require('./routes/api/availability');
const appointmentsRoutes = require('./routes/api/appointments');
const adminAuthRoutes = require('./routes/admin/auth');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Security Middleware
 */
// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        }
    }
}));

// Trust proxy (for rate limiting and IP detection behind reverse proxy)
app.set('trust proxy', 1);

/**
 * Body Parser Middleware
 */
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * Session Configuration
 */
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000, // 24 hours
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
});

app.use(session({
    key: 'nt_taxoffice_session',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict'
    }
}));

/**
 * Logging Middleware
 */
app.use(requestLoggerMiddleware());

/**
 * Static Files
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Routes
 */
app.use('/', indexRoutes);

// API routes with rate limiting
app.use('/api/availability', apiLimiter, availabilityRoutes);
app.use('/api/appointments', appointmentsRoutes); // Has its own specific rate limiters
app.use('/api/admin', adminAuthRoutes); // Has its own specific rate limiters

/**
 * Error Handling
 */
// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Initialize Database and Start Server
 */
async function startServer() {
    try {
        // Initialize database connection
        await initializeDatabase();
        info('Database initialized successfully');

        // Start Express server
        app.listen(PORT, () => {
            info(`NT - TAXOFFICE server running on http://localhost:${PORT}`);
            info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logError('Failed to start server', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

// Start the server
startServer();