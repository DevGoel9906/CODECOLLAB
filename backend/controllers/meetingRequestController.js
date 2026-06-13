const meetingRequestService = require('../services/meetingRequestService');
const { validationResult } = require('express-validator');

exports.getRequests = async (req, res) => {
  try {
    const requests = await meetingRequestService.getAllRequests();
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const request = await meetingRequestService.createRequest(req.body);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
