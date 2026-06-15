/**
 * routes/v1/maintainers.js
 *
 * Zero Trust Pipeline:
 * sanitize → validate → controller
 */

const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');

const maintainerController = require('../../controllers/maintainerController');
const sanitizer            = require('../../middleware/sanitizer');

// ── Validation Rules ──────────────────────────────────────────────────────────

const createMaintainerValidation = [
  body('user')
    .notEmpty().withMessage('User ID is required.')
    .isMongoId().withMessage('User must be a valid ID.'),

  body('project')
    .notEmpty().withMessage('Project ID is required.')
    .isMongoId().withMessage('Project must be a valid ID.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/v1/maintainers — list all maintainers
router.get('/', maintainerController.getMaintainers);

// POST /api/v1/maintainers — add a maintainer
// Pipeline: sanitize → validate → controller
router.post(
  '/',
  sanitizer,
  createMaintainerValidation,
  maintainerController.createMaintainer
);

module.exports = router;
