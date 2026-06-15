/**
 * errorHandler.js
 * Global Express Error Handler — Last Middleware in Chain
 *
 * Intercepts all errors thrown by controllers/services.
 * Maps known error types to safe, user-friendly responses.
 *
 * NEVER exposes:
 * - Stack traces
 * - MongoDB internals (connection strings, collection names)
 * - Raw error messages from the database layer
 * - Environment variables or secrets
 *
 * All full error details are logged server-side only.
 */

const errorHandler = (err, req, res, next) => {
  // Always log full details server-side
  console.error(
    `[ERROR] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ` +
    `Status: ${err.statusCode || err.status || 500} | ${err.name || 'Error'}: ${err.message}`
  );

  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input and try again.',
    });
  }

  // ── Mongoose CastError (bad ObjectId or type mismatch) ───────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format provided.',
    });
  }

  // ── MongoDB Duplicate Key Error ───────────────────────────────────────────
  if (err.code === 11000) {
    // Identify which field is duplicate (without leaking schema details)
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
    const friendlyField = field === 'email' ? 'email address' : field === 'userId' ? 'user ID' : 'record';
    return res.status(409).json({
      success: false,
      message: `This ${friendlyField} is already registered. Please use a different one.`,
    });
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid session token. Please log in again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Session has expired. Please log in again.',
    });
  }

  // ── MongoDB Connection / Operation Errors ─────────────────────────────────
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerError') {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again shortly.',
    });
  }

  // ── Custom App Errors (thrown with .statusCode) ───────────────────────────
  if (err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Request could not be processed.',
    });
  }

  // ── Default: 500 Internal Server Error ───────────────────────────────────
  res.status(500).json({
    success: false,
    message: 'Unable to process request. Please try again.',
  });
};

module.exports = errorHandler;
