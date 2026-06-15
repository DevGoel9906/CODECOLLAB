/**
 * services/meetingRequestService.js
 *
 * Meeting request business logic.
 *
 * Verifies that requester, recipient, and project all exist in the DB
 * before creating the meeting request. Uses typed error codes for
 * controller pattern-matching.
 */

const MeetingRequest = require('../models/MeetingRequest');
const User           = require('../models/User');
const Project        = require('../models/Project');
const { generateUniqueId } = require('../utils/idGenerator');

// Typed error factory
const createError = (code, message, statusCode = 400) => {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
};

class MeetingRequestService {
  /**
   * Return all meeting requests. MongoDB internals excluded.
   */
  async getAllRequests() {
    return await MeetingRequest.find().select('-_id -__v').lean();
  }

  /**
   * Create a meeting request after verifying all referenced entities exist.
   *
   * @throws ENTITY_NOT_FOUND — requester, recipient, or project not found
   */
  async createRequest(requestData) {
    const { requesterId, recipientId, projectId, message } = requestData;

    // Verify all referenced entities exist in parallel
    const [requester, recipient, project] = await Promise.all([
      User.findOne({ userId: requesterId }).select('userId').lean(),
      User.findOne({ userId: recipientId }).select('userId').lean(),
      Project.findOne({ projectId }).select('projectId').lean(),
    ]);

    if (!requester) {
      throw createError('ENTITY_NOT_FOUND', `Requester not found: ${requesterId}`);
    }
    if (!recipient) {
      throw createError('ENTITY_NOT_FOUND', `Recipient not found: ${recipientId}`);
    }
    if (!project) {
      throw createError('ENTITY_NOT_FOUND', `Project not found: ${projectId}`);
    }

    // Sanitize the message field before storage (belt-and-suspenders after middleware)
    const cleanMessage = message
      ? String(message).replace(/<[^>]+>/g, '').trim().slice(0, 500)
      : undefined;

    const requestId = await generateUniqueId('REQ', MeetingRequest, 'requestId');
    const request   = new MeetingRequest({
      ...requestData,
      message: cleanMessage,
      requestId,
    });
    await request.save();

    const requestObj = request.toObject();
    delete requestObj._id;
    delete requestObj.__v;
    return requestObj;
  }
}

module.exports = new MeetingRequestService();
