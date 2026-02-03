/**
 * Logger Utility
 * Simple logging system with different log levels and timestamps
 */

const { formatDateTime } = require('./timezone');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Current log level from environment (default: INFO)
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// Colors for terminal output (ANSI escape codes)
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  GREEN: '\x1b[32m',
  BLUE: '\x1b[34m',
  GRAY: '\x1b[90m',
};

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} metadata - Additional metadata
 * @returns {string}
 */
function formatLogMessage(level, message, metadata = {}) {
  const timestamp = formatDateTime(new Date());
  const metaStr = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '';
  return `[${timestamp}] [${level}] ${message} ${metaStr}`.trim();
}

/**
 * Check if log level should be displayed
 * @param {number} level
 * @returns {boolean}
 */
function shouldLog(level) {
  return level <= CURRENT_LOG_LEVEL;
}

/**
 * Log error message
 * @param {string} message
 * @param {Error|object} err - Error object or metadata
 */
function error(message, err = null) {
  if (!shouldLog(LOG_LEVELS.ERROR)) return;

  const metadata = {};
  if (err instanceof Error) {
    metadata.error = err.message;
    metadata.stack = err.stack;
  } else if (err) {
    Object.assign(metadata, err);
  }

  const logMessage = formatLogMessage('ERROR', message, metadata);
  console.error(`${COLORS.RED}${logMessage}${COLORS.RESET}`);
}

/**
 * Log warning message
 * @param {string} message
 * @param {object} metadata - Additional metadata
 */
function warn(message, metadata = {}) {
  if (!shouldLog(LOG_LEVELS.WARN)) return;

  const logMessage = formatLogMessage('WARN', message, metadata);
  console.warn(`${COLORS.YELLOW}${logMessage}${COLORS.RESET}`);
}

/**
 * Log info message
 * @param {string} message
 * @param {object} metadata - Additional metadata
 */
function info(message, metadata = {}) {
  if (!shouldLog(LOG_LEVELS.INFO)) return;

  const logMessage = formatLogMessage('INFO', message, metadata);
  console.log(`${COLORS.GREEN}${logMessage}${COLORS.RESET}`);
}

/**
 * Log debug message
 * @param {string} message
 * @param {object} metadata - Additional metadata
 */
function debug(message, metadata = {}) {
  if (!shouldLog(LOG_LEVELS.DEBUG)) return;

  const logMessage = formatLogMessage('DEBUG', message, metadata);
  console.log(`${COLORS.GRAY}${logMessage}${COLORS.RESET}`);
}

/**
 * Log HTTP request
 * @param {object} req - Express request object
 */
function logRequest(req) {
  if (!shouldLog(LOG_LEVELS.INFO)) return;

  const metadata = {
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  info('HTTP Request', metadata);
}

/**
 * Log HTTP response
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
function logResponse(req, res, duration) {
  if (!shouldLog(LOG_LEVELS.INFO)) return;

  const metadata = {
    method: req.method,
    path: req.path,
    status: res.statusCode,
    duration: `${duration}ms`,
  };

  let level;
  let color;
  if (res.statusCode >= 500) {
    level = 'ERROR';
    color = COLORS.RED;
  } else if (res.statusCode >= 400) {
    level = 'WARN';
    color = COLORS.YELLOW;
  } else {
    level = 'INFO';
    color = COLORS.GREEN;
  }

  const logMessage = formatLogMessage(level, 'HTTP Response', metadata);

  if (level === 'ERROR') {
    console.error(`${color}${logMessage}${COLORS.RESET}`);
  } else if (level === 'WARN') {
    console.warn(`${color}${logMessage}${COLORS.RESET}`);
  } else {
    console.log(`${color}${logMessage}${COLORS.RESET}`);
  }
}

/**
 * Log database query (for debugging)
 * @param {string} query - SQL query
 * @param {array} params - Query parameters
 */
function logQuery(query, params = []) {
  if (!shouldLog(LOG_LEVELS.DEBUG)) return;

  const metadata = {
    query: query.replace(/\s+/g, ' ').trim(),
    params: params.length > 0 ? params : undefined,
  };

  debug('Database Query', metadata);
}

/**
 * Log email sending
 * @param {string} recipient - Email recipient
 * @param {string} subject - Email subject
 * @param {boolean} success - Whether email was sent successfully
 */
function logEmail(recipient, subject, success = true) {
  const metadata = {
    recipient,
    subject,
    status: success ? 'sent' : 'failed',
  };

  if (success) {
    info('Email Sent', metadata);
  } else {
    error('Email Failed', metadata);
  }
}

/**
 * Log appointment creation
 * @param {string} clientName
 * @param {string} appointmentDate
 * @param {string} appointmentTime
 */
function logAppointmentCreated(clientName, appointmentDate, appointmentTime) {
  info('Appointment Created', {
    client: clientName,
    date: appointmentDate,
    time: appointmentTime,
  });
}

/**
 * Log appointment status change
 * @param {number} appointmentId
 * @param {string} oldStatus
 * @param {string} newStatus
 * @param {string} changedBy
 */
function logAppointmentStatusChange(appointmentId, oldStatus, newStatus, changedBy) {
  info('Appointment Status Changed', {
    id: appointmentId,
    oldStatus,
    newStatus,
    changedBy,
  });
}

/**
 * Log admin login
 * @param {string} username
 * @param {boolean} success
 */
function logAdminLogin(username, success = true) {
  if (success) {
    info('Admin Login Successful', { username });
  } else {
    warn('Admin Login Failed', { username });
  }
}

/**
 * Log security event
 * @param {string} event - Event description
 * @param {object} metadata - Additional metadata
 */
function logSecurityEvent(event, metadata = {}) {
  warn(`Security Event: ${event}`, metadata);
}

/**
 * Create Express middleware for request logging
 * @returns {function}
 */
function requestLoggerMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();

    // Log request
    logRequest(req);

    // Capture response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logResponse(req, res, duration);
    });

    next();
  };
}

module.exports = {
  // Log levels
  LOG_LEVELS,

  // Basic logging
  error,
  warn,
  info,
  debug,

  // Specialized logging
  logRequest,
  logResponse,
  logQuery,
  logEmail,
  logAppointmentCreated,
  logAppointmentStatusChange,
  logAdminLogin,
  logSecurityEvent,

  // Middleware
  requestLoggerMiddleware,
};
