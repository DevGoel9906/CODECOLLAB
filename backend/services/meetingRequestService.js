const MeetingRequest = require('../models/MeetingRequest');

class MeetingRequestService {
  async getAllRequests() {
    return await MeetingRequest.find()
      .populate('requester', 'name')
      .populate('recipient', 'name')
      .populate('project', 'title');
  }

  async createRequest(requestData) {
    const request = new MeetingRequest(requestData);
    return await request.save();
  }
}

module.exports = new MeetingRequestService();
