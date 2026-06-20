/**
 * routes/v1/users.js
 *
 * Zero Trust Pipeline:
 * rate-limit → sanitize → validate → controller
 *
 * GET /api/v1/users        — list all users (admin/public)
 * GET /api/v1/users/:userId — get single user profile
 * POST /api/v1/users       — legacy registration (kept for backward compat)
 *
 * NOTE: New registrations should use POST /api/v1/auth/register
 */

const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');

const userController = require('../../controllers/userController');
const sanitizer      = require('../../middleware/sanitizer');
const { authLimiter } = require('../../middleware/rateLimiter');

// ── Validation Rules ──────────────────────────────────────────────────────────

const createUserValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Please provide your full name.')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.')
    .matches(/^[a-zA-Z\s\-'.]+$/).withMessage('Name contains invalid characters.')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('Please enter a valid email address in the format name@example.com.')
    .isEmail().withMessage('Please enter a valid email address in the format name@example.com.')
    .isLength({ max: 254 }).withMessage('Email address is too long.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must contain at least 8 characters.')
    .isLength({ max: 128 }).withMessage('Password must not exceed 128 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),

  body('github')
    .optional({ checkFalsy: true })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('GitHub URL must be a valid HTTPS URL (e.g. https://github.com/username).'),

  body('linkedin')
    .optional({ checkFalsy: true })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('LinkedIn URL must be a valid HTTPS URL.'),

  body('role')
    .optional()
    .isIn(['Student', 'Developer', 'Maintainer', 'Contributor', 'Designer', 'Other'])
    .withMessage('Please select a valid role.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/v1/users — list users (passwords never returned — enforced in service)
router.get('/', userController.getUsers);

// GET /api/v1/users/:userId — get a specific user profile
router.get('/:userId', userController.getUserById);

// POST /api/v1/users — register a new user (legacy — prefer /auth/register)
// Pipeline: rate-limit → sanitize → validate → controller
router.post(
  '/',
  authLimiter,
  sanitizer,
  createUserValidation,
  userController.createUser
);

module.exports = router;
