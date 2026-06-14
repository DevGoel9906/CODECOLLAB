const MeetingRequest = require('../models/MeetingRequest');
const User = require('../models/User');
const Project = require('../models/Project');
const { generateUniqueId } = require('../utils/idGenerator');

class MeetingRequestService {
  async getAllRequests() {
    return await MeetingRequest.find().select('-_id -__v');
  }

  async createRequest(requestData) {
    const { requesterId, recipientId, projectId } = requestData;

    // Verify related records exist
    const [requester, recipient, project] = await Promise.all([
      User.findOne({ userId: requesterId }),
      User.findOne({ userId: recipientId }),
      Project.findOne({ projectId })
    ]);

    if (!requester || !recipient || !project) {
      throw new Error('Invalid requesterId, recipientId, or projectId');
    }

    const requestId = await generateUniqueId('REQ', MeetingRequest, 'requestId');
    const request = new MeetingRequest({ ...requestData, requestId });
    await request.save();

    const requestObj = request.toObject();
    delete requestObj._id;
    delete requestObj.__v;
    return requestObj;
  }
}

module.exports = new MeetingRequestService();
