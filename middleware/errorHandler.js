/**
 * Error Handler Middleware
 * Centralized error handling for Express application
 */

const { error: logError } = require('../utils/logger');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle MySQL/Database errors
 * @param {Error} err
 * @returns {object}
 */
function handleDatabaseError(err) {
  // Duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return {
      statusCode: 409,
      message: 'Αυτή η χρονική υποδοχή είναι ήδη κατειλημμένη. Παρακαλώ επιλέξτε άλλη ώρα.',
      isOperational: true,
    };
  }

  // Foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return {
      statusCode: 400,
      message: 'Μη έγκυρη αναφορά δεδομένων.',
      isOperational: true,
    };
  }

  // Connection error
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return {
      statusCode: 503,
      message: 'Η υπηρεσία βάσης δεδομένων δεν είναι διαθέσιμη αυτή τη στιγμή.',
      isOperational: false,
    };
  }

  // Timeout error
  if (err.code === 'ETIMEDOUT' || err.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
    return {
      statusCode: 504,
      message: 'Η αίτηση έληξε. Παρακαλώ δοκιμάστε ξανά.',
      isOperational: true,
    };
  }

  // Generic database error
  return {
    statusCode: 500,
    message: 'Σφάλμα βάσης δεδομένων.',
    isOperational: false,
  };
}

/**
 * Handle validation errors
 * @param {object} validationErrors
 * @returns {object}
 */
function handleValidationError(validationErrors) {
  return {
    statusCode: 400,
    message: 'Μη έγκυρα δεδομένα.',
    errors: validationErrors,
    isOperational: true,
  };
}

/**
 * Handle JSON parsing errors
 * @returns {object}
 */
function handleJsonError() {
  return {
    statusCode: 400,
    message: 'Μη έγκυρα δεδομένα JSON.',
    isOperational: true,
  };
}

/**
 * Error handler middleware
 * Must be registered AFTER all routes
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = {
    message: err.message || 'Παρουσιάστηκε σφάλμα.',
    statusCode: err.statusCode || 500,
    isOperational: err.isOperational || false,
  };

  // Handle specific error types
  if (err.code && err.code.startsWith('ER_')) {
    // MySQL error
    error = handleDatabaseError(err);
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // JSON parsing error
    error = handleJsonError(err);
  } else if (err.name === 'ValidationError' && err.errors) {
    // Validation error with multiple fields
    error = handleValidationError(err.errors);
  }

  // Log error
  logError(error.message, {
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection?.remoteAddress,
    isOperational: error.isOperational,
    stack: error.isOperational ? undefined : err.stack,
  });

  // Don't expose error details in production for non-operational errors
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Prepare response
  const response = {
    success: false,
    message: error.message,
  };

  // Add validation errors if present
  if (error.errors) {
    response.errors = error.errors;
  }

  // Add stack trace in development for non-operational errors
  if (isDevelopment && !error.isOperational && err.stack) {
    response.stack = err.stack;
  }

  // Send response
  res.status(error.statusCode).json(response);
}

/**
 * 404 Not Found handler
 * Must be registered AFTER all routes but BEFORE error handler
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(`Η σελίδα ${req.originalUrl} δεν βρέθηκε.`, 404, true);
  next(error);
}

/**
 * Async route handler wrapper
 * Catches errors from async route handlers and passes to error middleware
 * @param {function} fn - Async route handler
 * @returns {function}
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create operational error (expected errors that should be handled gracefully)
 * @param {string} message
 * @param {number} statusCode
 * @returns {AppError}
 */
function createError(message, statusCode = 500) {
  return new AppError(message, statusCode, true);
}

/**
 * Create 400 Bad Request error
 * @param {string} message
 * @returns {AppError}
 */
function badRequest(message = 'Μη έγκυρη αίτηση.') {
  return new AppError(message, 400, true);
}

/**
 * Create 401 Unauthorized error
 * @param {string} message
 * @returns {AppError}
 */
function unauthorized(message = 'Απαιτείται έλεγχος ταυτότητας.') {
  return new AppError(message, 401, true);
}

/**
 * Create 403 Forbidden error
 * @param {string} message
 * @returns {AppError}
 */
function forbidden(message = 'Δεν έχετε δικαίωμα πρόσβασης.') {
  return new AppError(message, 403, true);
}

/**
 * Create 404 Not Found error
 * @param {string} message
 * @returns {AppError}
 */
function notFound(message = 'Δεν βρέθηκε.') {
  return new AppError(message, 404, true);
}

/**
 * Create 409 Conflict error
 * @param {string} message
 * @returns {AppError}
 */
function conflict(message = 'Σύγκρουση δεδομένων.') {
  return new AppError(message, 409, true);
}

/**
 * Create 500 Internal Server Error
 * @param {string} message
 * @returns {AppError}
 */
function internalError(message = 'Εσωτερικό σφάλμα διακομιστή.') {
  return new AppError(message, 500, false);
}

module.exports = {
  // Error class
  AppError,

  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,

  // Error creators
  createError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  internalError,

  // Error handlers
  handleDatabaseError,
  handleValidationError,
  handleJsonError,
};
