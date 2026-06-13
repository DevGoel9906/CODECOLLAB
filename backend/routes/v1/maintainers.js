const express = require('express');
const router = express.Router();
const maintainerController = require('../../controllers/maintainerController');
const { body } = require('express-validator');

// GET all maintainers
router.get('/', maintainerController.getMaintainers);

// POST new maintainer
router.post(
  '/',
  [
    body('user').isMongoId().withMessage('Valid user ID is required'),
    body('project').isMongoId().withMessage('Valid project ID is required'),
  ],
  maintainerController.createMaintainer
);

module.exports = router;
