/**
 * ActivityLog.js — Security Audit Trail Model
 *
 * Stores every meaningful platform action for audit, compliance,
 * and security monitoring. Indexed for fast querying by user,
 * action type, and time.
 *
 * Collection: activity_logs
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    // Custom userId string (USR-XXXXXX), not an ObjectId reference —
    // logs must survive even if a user document is deleted
    userId: {
      type: String,
      default: 'anonymous',
      trim: true,
    },

    // Human-readable action identifier
    // Examples: 'PROJECT_CREATED', 'STATUS_UPDATED', 'UNAUTHORIZED_ATTEMPT', 'SECURITY_THREAT'
    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // IP address of the requester
    ipAddress: {
      type: String,
      default: 'unknown',
      trim: true,
    },

    // Outcome of the request
    requestResult: {
      type: String,
      enum: ['success', 'failure', 'blocked'],
      default: 'success',
    },

    // Optional contextual details (e.g. which project, error reason)
    // Never store sensitive data (passwords, tokens, secrets) here
    details: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Indexes for common query patterns
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ requestResult: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 }); // Time-range queries

module.exports = mongoose.model('ActivityLog', activityLogSchema);
