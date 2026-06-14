const meetingRequestService = require('../services/meetingRequestService');
const { validationResult } = require('express-validator');

exports.getRequests = async (req, res) => {
  try {
    const requests = await meetingRequestService.getAllRequests();
    res.status(200).json({ success: true, message: 'Requests retrieved', data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', errors: [error.message] });
  }
};

exports.createRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  try {
    const request = await meetingRequestService.createRequest(req.body);
    res.status(201).json({ success: true, message: 'Meeting request created successfully', data: { request } });
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ success: false, message: error.message, errors: [error.message] });
    }
    res.status(500).json({ success: false, message: 'Server Error', errors: [error.message] });
  }
};
