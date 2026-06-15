/**
 * routes/v1/meetingRequests.js
 *
 * Zero Trust Pipeline:
 * rate-limit → sanitize → verify user ID formats → verify project ID format → validate → controller
 */

const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');

const meetingRequestController              = require('../../controllers/meetingRequestController');
const sanitizer                             = require('../../middleware/sanitizer');
const { verifyMeetingUserIds, verifyProjectIdBody } = require('../../middleware/requestVerifier');
const { meetingRequestLimiter }             = require('../../middleware/rateLimiter');

// ── Validation Rules ──────────────────────────────────────────────────────────

const createRequestValidation = [
  body('requesterId')
    .isString()
    .notEmpty().withMessage('requesterId is required.')
    .matches(/^USR-\d{6}$/).withMessage('requesterId must be a valid user ID (USR-XXXXXX).'),

  body('recipientId')
    .isString()
    .notEmpty().withMessage('recipientId is required.')
    .matches(/^USR-\d{6}$/).withMessage('recipientId must be a valid user ID (USR-XXXXXX).'),

  body('projectId')
    .isString()
    .notEmpty().withMessage('projectId is required.')
    .matches(/^PRJ-\d{6}$/).withMessage('projectId must be a valid project ID (PRJ-XXXXXX).'),

  body('message')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 500 }).withMessage('Message must not exceed 500 characters.')
    .escape(),

  body('scheduledDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('scheduledDate must be a valid ISO 8601 date.')
    .toDate(),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/v1/meeting-requests — list all meeting requests
router.get('/', meetingRequestController.getRequests);

// POST /api/v1/meeting-requests — create a new meeting request
// Pipeline: rate-limit → sanitize → verify user IDs → verify project ID → validate → controller
router.post(
  '/',
  meetingRequestLimiter,
  sanitizer,
  verifyMeetingUserIds,
  verifyProjectIdBody,
  createRequestValidation,
  meetingRequestController.createRequest
);

module.exports = router;
