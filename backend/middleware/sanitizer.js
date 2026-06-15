/**
 * sanitizer.js
 * Zero Trust Input Sanitization Middleware
 *
 * Runs on all routes BEFORE controllers.
 * Detects and blocks: XSS, HTML injection, script injection,
 * MongoDB operator injection, and NoSQL injection attacks.
 *
 * On threat detection → stops execution immediately.
 * No controller, no service, no DB call runs.
 */

// MongoDB operators that should never appear in user input
const MONGO_OPERATORS = new Set([
  '$gt', '$lt', '$gte', '$lte', '$ne', '$eq',
  '$in', '$nin', '$or', '$and', '$not', '$nor',
  '$where', '$regex', '$expr', '$jsonSchema',
  '$elemMatch', '$size', '$all', '$text', '$search',
  '$mod', '$type', '$exists', '$set', '$unset',
  '$push', '$pull', '$addToSet', '$inc', '$rename',
]);

// Patterns that signal XSS or script injection
const XSS_PATTERNS = [
  /<script[\s\S]*?>/i,
  /<\/script>/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /on\w+\s*=\s*["'\`]/i,
  /<iframe[\s\S]*?>/i,
  /<object[\s\S]*?>/i,
  /<embed[\s\S]*?>/i,
  /<link[\s\S]*?>/i,
  /data\s*:\s*text\/html/i,
  /expression\s*\(/i,
];

/**
 * Recursively scan an object for security threats.
 * Returns true if any threat is found.
 */
const hasThreat = (value, depth = 0) => {
  if (depth > 12) return false;

  if (typeof value === 'string') {
    return XSS_PATTERNS.some((pattern) => pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasThreat(item, depth + 1));
  }

  if (typeof value === 'object' && value !== null) {
    for (const key of Object.keys(value)) {
      // MongoDB operator key injection
      if (MONGO_OPERATORS.has(key)) return true;
      // Keys that start with $ are always suspicious
      if (typeof key === 'string' && key.trim().startsWith('$')) return true;
      if (hasThreat(value[key], depth + 1)) return true;
    }
  }

  return false;
};

/**
 * Recursively deep-sanitize a value.
 * Strips dangerous HTML tags and drops MongoDB operator keys.
 */
const deepSanitize = (value, depth = 0) => {
  if (depth > 12) return value;

  if (typeof value === 'string') {
    return value
      // Remove full <script> blocks
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove inline event handlers (onclick=, onload=, etc.)
      .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`|\S+)/gi, '')
      // Remove dangerous tags entirely
      .replace(/<(script|iframe|object|embed|link|meta|base|form)[^>]*>/gi, '')
      // Remove closing dangerous tags
      .replace(/<\/(script|iframe|object|embed|link|meta|base|form)>/gi, '')
      // Trim whitespace
      .trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepSanitize(item, depth + 1));
  }

  if (typeof value === 'object' && value !== null) {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      // Drop MongoDB operator keys entirely
      if (MONGO_OPERATORS.has(key)) continue;
      if (typeof key === 'string' && key.trim().startsWith('$')) continue;
      clean[key] = deepSanitize(val, depth + 1);
    }
    return clean;
  }

  return value;
};

/**
 * Main sanitizer middleware.
 * 1. Threat scan → block immediately on detection
 * 2. Deep sanitize → clean data before passing to controller
 */
const sanitizer = (req, res, next) => {
  try {
    // Only process requests with a body
    if (!req.body || typeof req.body !== 'object') return next();

    // Phase 1: Threat detection — abort before touching DB
    if (hasThreat(req.body)) {
      console.warn(
        `[SECURITY] Threat detected | IP: ${req.ip} | ${req.method} ${req.originalUrl} | Body keys: ${Object.keys(req.body).join(', ')}`
      );
      return res.status(400).json({
        success: false,
        securityThreat: true,
        message: 'Suspicious or unauthorized activity was detected. Request blocked.',
      });
    }

    // Phase 2: Deep sanitize — clean the payload
    req.body = deepSanitize(req.body);

    next();
  } catch (err) {
    console.error('[Sanitizer] Unexpected error:', err.message);
    next(err);
  }
};

module.exports = sanitizer;
