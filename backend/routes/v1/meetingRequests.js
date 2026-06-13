const express = require('express');
const router = express.Router();
const meetingRequestController = require('../../controllers/meetingRequestController');
const { body } = require('express-validator');

// GET all meeting requests
router.get('/', meetingRequestController.getRequests);

// POST new meeting request
router.post(
  '/',
  [
    body('requester').isMongoId().withMessage('Valid requester ID is required'),
    body('recipient').isMongoId().withMessage('Valid recipient ID is required'),
    body('project').isMongoId().withMessage('Valid project ID is required'),
    body('message').optional().trim().escape(),
    body('scheduledDate').optional().isISO8601().toDate(),
  ],
  meetingRequestController.createRequest
);

module.exports = router;
