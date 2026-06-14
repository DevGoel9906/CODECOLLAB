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
    body('requesterId').isString().notEmpty().withMessage('Valid requester ID is required'),
    body('recipientId').isString().notEmpty().withMessage('Valid recipient ID is required'),
    body('projectId').isString().notEmpty().withMessage('Valid project ID is required'),
    body('message').optional().trim().escape(),
    body('scheduledDate').optional().isISO8601().toDate(),
  ],
  meetingRequestController.createRequest
);

module.exports = router;
