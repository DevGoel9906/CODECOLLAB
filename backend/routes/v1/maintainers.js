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
  body('userId')
    .notEmpty().withMessage('User ID is required.')
    .matches(/^USR-\d{6}$/).withMessage('userId must be a valid user ID (USR-XXXXXX).'),

  body('projectId')
    .notEmpty().withMessage('Project ID is required.')
    .matches(/^PRJ-\d{6}$/).withMessage('projectId must be a valid project ID (PRJ-XXXXXX).'),
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
