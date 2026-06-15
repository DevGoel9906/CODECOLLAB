/**
 * routes/v1/users.js
 *
 * Zero Trust Pipeline:
 * rate-limit → sanitize → validate → controller
 *
 * Registration is a high-value target — authLimiter applies strict throttling.
 * Duplicate email/userId detection is handled in userService and
 * mapped to a safe response in userController.
 */

const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');

const userController = require('../../controllers/userController');
const sanitizer      = require('../../middleware/sanitizer');
const { authLimiter } = require('../../middleware/rateLimiter');

// ── Validation Rules ──────────────────────────────────────────────────────────

const createUserValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.')
    .matches(/^[a-zA-Z\s\-'.]+$/).withMessage('Name contains invalid characters.')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .isLength({ max: 254 }).withMessage('Email address is too long.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .isLength({ max: 128 }).withMessage('Password must not exceed 128 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),

  body('github')
    .optional({ checkFalsy: true })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('GitHub URL must be a valid HTTPS URL.'),

  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Invalid role specified.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/v1/users — list users (passwords never returned — enforced in service)
router.get('/', userController.getUsers);

// POST /api/v1/users — register a new user
// Pipeline: rate-limit → sanitize → validate → controller
router.post(
  '/',
  authLimiter,
  sanitizer,
  createUserValidation,
  userController.createUser
);

module.exports = router;
