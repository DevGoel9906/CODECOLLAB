/**
 * activityLogService.js — Centralized Security Audit Logger
 *
 * Provides a single `log()` function used across all controllers
 * to record security-relevant actions.
 *
 * Design principles:
 * - Fire-and-forget: uses setImmediate() so logging NEVER blocks the HTTP response
 * - Fault-tolerant: log failures are caught and printed to stderr — they never
 *   crash the application or affect the user response
 * - Privacy-safe: never logs passwords, tokens, or secrets
 *
 * Usage:
 *   const activityLog = require('../services/activityLogService');
 *   activityLog.log(userId, 'PROJECT_CREATED', req.ip, 'success', `projectId: ${id}`);
 */

const ActivityLog = require('../models/ActivityLog');

// ── Canonical Action Constants ────────────────────────────────────────────────
// Centralised here so all controllers use consistent, query-friendly action names
const ACTIONS = Object.freeze({
  // User actions
  USER_REGISTERED:          'USER_REGISTERED',
  USER_LOGIN:               'USER_LOGIN',

  // Project actions
  PROJECT_CREATED:          'PROJECT_CREATED',
  PROJECT_STATUS_UPDATED:   'PROJECT_STATUS_UPDATED',
  PROJECT_VIEWED:           'PROJECT_VIEWED',

  // Meeting actions
  MEETING_REQUEST_CREATED:  'MEETING_REQUEST_CREATED',

  // Maintainer actions
  MAINTAINER_ADDED:         'MAINTAINER_ADDED',

  // Security events
  UNAUTHORIZED_ATTEMPT:     'UNAUTHORIZED_ATTEMPT',
  SECURITY_THREAT_DETECTED: 'SECURITY_THREAT_DETECTED',
  RATE_LIMIT_EXCEEDED:      'RATE_LIMIT_EXCEEDED',
  VALIDATION_FAILED:        'VALIDATION_FAILED',
});

/**
 * log(userId, action, ipAddress, result, details)
 *
 * @param {string} userId     - Custom user ID (USR-XXXXXX) or 'anonymous'
 * @param {string} action     - Action constant from ACTIONS (or any string)
 * @param {string} ipAddress  - req.ip value
 * @param {string} result     - 'success' | 'failure' | 'blocked'
 * @param {string} [details]  - Optional context string (max 500 chars, no secrets)
 */
const log = (userId, action, ipAddress, result = 'success', details = '') => {
  // setImmediate defers execution until after the current I/O event — never blocks
  setImmediate(async () => {
    try {
      await ActivityLog.create({
        userId:        userId  || 'anonymous',
        action:        action  || 'UNKNOWN',
        ipAddress:     ipAddress || 'unknown',
        requestResult: result,
        details:       String(details).slice(0, 500), // Hard cap — never overflows field
      });
    } catch (err) {
      // Log to stderr but never throw — a logging failure must not affect the request
      console.error('[ActivityLog] Failed to write entry:', err.message);
    }
  });
};

module.exports = { log, ACTIONS };
