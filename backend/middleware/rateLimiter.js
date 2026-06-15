/**
 * rateLimiter.js
 * Granular Per-Route Rate Limiting
 *
 * Provides targeted rate limiters for different API endpoint
 * sensitivity levels. Replaces the single global limiter.
 *
 * All limiters return structured JSON (not plain text strings).
 * Uses standard rate-limit headers (RateLimit-*, not deprecated X-RateLimit-*).
 */

const rateLimit = require('express-rate-limit');

/**
 * Helper: build a consistent rate limiter with standard JSON response.
 */
const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,   // Emit RateLimit-* headers (RFC draft)
    legacyHeaders: false,     // Disable X-RateLimit-* headers
    handler: (req, res) => {
      console.warn(`[RATE-LIMIT] Blocked | IP: ${req.ip} | ${req.method} ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        message,
      });
    },
  });

// ── Auth endpoints (registration, login) ─────────────────────────────────────
// Strict: 10 attempts per 15 minutes per IP
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
});

// ── Project creation ──────────────────────────────────────────────────────────
// Moderate: 5 new projects per 15 minutes per IP
const projectCreateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many project creation requests from this IP. Please wait before trying again.',
});

// ── Meeting requests ──────────────────────────────────────────────────────────
// Moderate: 10 requests per 15 minutes per IP
const meetingRequestLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many meeting requests from this IP. Please wait before trying again.',
});

// ── General API fallback ──────────────────────────────────────────────────────
// Loose: 100 requests per 15 minutes per IP (applied globally to /api/*)
const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP. Please try again in 15 minutes.',
});

module.exports = {
  authLimiter,
  projectCreateLimiter,
  meetingRequestLimiter,
  generalLimiter,
};
