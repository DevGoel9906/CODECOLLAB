/**
 * requestVerifier.js
 * Zero Trust Request Verification Middleware
 *
 * Verifies that IDs in params and body match the expected
 * CodeCollab format (USR-XXXXXX, PRJ-XXXXXX, REQ-XXXXXX).
 *
 * Tampered, malformed, or unexpected ID formats are blocked
 * immediately — no DB call, no service call.
 */

// Custom ID format patterns
const USER_ID_PATTERN  = /^USR-\d{6}$/;
const PROJECT_ID_PATTERN = /^PRJ-\d{6}$/;
const REQUEST_ID_PATTERN = /^REQ-\d{6}$/;

/**
 * Emit a blocked response for suspicious ID input.
 */
const blockTamperedId = (req, res, field, value) => {
  console.warn(
    `[SECURITY] Tampered ID detected | Field: ${field} | Value: ${String(value).slice(0, 40)} | IP: ${req.ip} | ${req.method} ${req.originalUrl}`
  );
  return res.status(400).json({
    success: false,
    securityThreat: true,
    message: 'Suspicious or unauthorized activity was detected. Request blocked.',
  });
};

/**
 * Verifies :projectId route param is a valid PRJ-XXXXXX format.
 * Use on any route that accepts a projectId param.
 */
const verifyProjectParam = (req, res, next) => {
  const { projectId } = req.params;
  if (projectId !== undefined && !PROJECT_ID_PATTERN.test(projectId)) {
    return blockTamperedId(req, res, 'projectId (param)', projectId);
  }
  next();
};

/**
 * Verifies ownerId in request body is a valid USR-XXXXXX format.
 * Use on project creation and status update routes.
 */
const verifyOwnerIdBody = (req, res, next) => {
  const { ownerId } = req.body;
  if (ownerId !== undefined && !USER_ID_PATTERN.test(ownerId)) {
    return blockTamperedId(req, res, 'ownerId (body)', ownerId);
  }
  next();
};

/**
 * Verifies requesterId and recipientId in body are valid USR-XXXXXX.
 * Use on meeting request creation routes.
 */
const verifyMeetingUserIds = (req, res, next) => {
  const { requesterId, recipientId } = req.body;

  if (requesterId !== undefined && !USER_ID_PATTERN.test(requesterId)) {
    return blockTamperedId(req, res, 'requesterId (body)', requesterId);
  }

  if (recipientId !== undefined && !USER_ID_PATTERN.test(recipientId)) {
    return blockTamperedId(req, res, 'recipientId (body)', recipientId);
  }

  next();
};

/**
 * Verifies projectId in body is a valid PRJ-XXXXXX format.
 * Use on meeting request creation routes.
 */
const verifyProjectIdBody = (req, res, next) => {
  const { projectId } = req.body;
  if (projectId !== undefined && !PROJECT_ID_PATTERN.test(projectId)) {
    return blockTamperedId(req, res, 'projectId (body)', projectId);
  }
  next();
};

module.exports = {
  verifyProjectParam,
  verifyOwnerIdBody,
  verifyMeetingUserIds,
  verifyProjectIdBody,
  USER_ID_PATTERN,
  PROJECT_ID_PATTERN,
  REQUEST_ID_PATTERN,
};
