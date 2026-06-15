/**
 * controllers/meetingRequestController.js
 *
 * By the time this controller runs, the Zero Trust pipeline has:
 * - Rate-limited the request
 * - Sanitized all inputs
 * - Verified ID formats (requesterId, recipientId, projectId)
 * - Passed validation
 *
 * Controller focuses on: calling service, logging, and returning a safe response.
 */

const { validationResult } = require('express-validator');
const meetingRequestService = require('../services/meetingRequestService');
const activityLog           = require('../services/activityLogService');

// ── GET /api/v1/meeting-requests ──────────────────────────────────────────────

exports.getRequests = async (req, res, next) => {
  try {
    const requests = await meetingRequestService.getAllRequests();
    res.status(200).json({ success: true, message: 'Requests retrieved.', data: requests });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/meeting-requests ─────────────────────────────────────────────

exports.createRequest = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    activityLog.log(
      req.body.requesterId || 'anonymous',
      activityLog.ACTIONS.VALIDATION_FAILED,
      req.ip,
      'failure',
      `Meeting request validation failed: ${errors.array().map(e => e.msg).join('; ')}`
    );
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const request = await meetingRequestService.createRequest(req.body);

    activityLog.log(
      req.body.requesterId,
      activityLog.ACTIONS.MEETING_REQUEST_CREATED,
      req.ip,
      'success',
      `requestId: ${request.requestId} | project: ${req.body.projectId}`
    );

    res.status(201).json({
      success: true,
      message: 'Meeting request created successfully.',
      data: { request },
    });
  } catch (err) {
    // Service throws ENTITY_NOT_FOUND when requester/recipient/project don't exist
    if (err.code === 'ENTITY_NOT_FOUND') {
      activityLog.log(
        req.body.requesterId || 'anonymous',
        activityLog.ACTIONS.SECURITY_THREAT_DETECTED,
        req.ip,
        'blocked',
        `Invalid entity reference in meeting request: ${err.message}`
      );
      return res.status(400).json({
        success: false,
        securityThreat: true,
        message: 'Suspicious or unauthorized activity was detected. Request blocked.',
      });
    }
    next(err);
  }
};
