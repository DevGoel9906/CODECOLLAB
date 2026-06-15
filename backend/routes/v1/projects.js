/**
 * routes/v1/projects.js
 *
 * Zero Trust Pipeline applied to every route:
 * sanitizer → requestVerifier → (ownershipVerifier on mutations) → validation → controller
 */

const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');

const projectController = require('../../controllers/projectController');
const sanitizer         = require('../../middleware/sanitizer');
const { verifyProjectParam, verifyOwnerIdBody } = require('../../middleware/requestVerifier');
const { verifyProjectOwnership }                = require('../../middleware/ownershipVerifier');
const { projectCreateLimiter }                  = require('../../middleware/rateLimiter');

// ── Shared validation rules ───────────────────────────────────────────────────

const createProjectValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 120 }).withMessage('Title must be 120 characters or fewer.')
    .escape(),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required.')
    .custom((value) => {
      const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 500) {
        throw new Error('Description must not exceed 500 words.');
      }
      return true;
    })
    .escape(),

  body('ownerId')
    .isString()
    .notEmpty().withMessage('ownerId is required.')
    .matches(/^USR-\d{6}$/).withMessage('ownerId must be a valid user ID (USR-XXXXXX).'),

  body('githubLink')
    .optional({ checkFalsy: true })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('GitHub link must be a valid HTTPS URL.'),

  body('techStack')
    .optional()
    .isArray({ max: 20 }).withMessage('Tech stack must be an array with at most 20 items.')
    .custom((arr) => {
      if (arr.some((item) => typeof item !== 'string' || item.length > 50)) {
        throw new Error('Each tech stack item must be a string of 50 characters or fewer.');
      }
      return true;
    }),
];

const updateStatusValidation = [
  body('ownerId')
    .isString()
    .notEmpty().withMessage('ownerId is required.')
    .matches(/^USR-\d{6}$/).withMessage('ownerId must be a valid user ID.'),

  body('status')
    .isString()
    .notEmpty()
    .isIn(['ongoing', 'complete', 'drop idea'])
    .withMessage('Status must be one of: ongoing, complete, drop idea.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/v1/projects — list all projects
router.get('/', projectController.getProjects);

// POST /api/v1/projects — create a new project
// Pipeline: rate-limit → sanitize → verify ownerId format → validate → controller
router.post(
  '/',
  projectCreateLimiter,
  sanitizer,
  verifyOwnerIdBody,
  createProjectValidation,
  projectController.createProject
);

// PATCH /api/v1/projects/:projectId/status — owner-only status update
// Pipeline: sanitize → verify param → verify body ownerId → ownership DB check → validate → controller
router.patch(
  '/:projectId/status',
  sanitizer,
  verifyProjectParam,
  verifyOwnerIdBody,
  verifyProjectOwnership,     // DB ownership check — blocks if mismatch
  updateStatusValidation,
  projectController.updateProjectStatus
);

module.exports = router;
