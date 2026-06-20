/**
 * routes/v1/auth.js
 *
 * Authentication Router: Sign In and Sign Up pipelines
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const authController = require('../../controllers/authController');
const sanitizer = require('../../middleware/sanitizer');
const { authLimiter } = require('../../middleware/rateLimiter');

// Registration validation pipeline
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Please provide your full name so others can identify you.')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.')
    .matches(/^[a-zA-Z\s\-'.]+$/).withMessage('Name contains invalid characters.')
    .escape(),

  body('username')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Please enter a valid email address in the format name@example.com.')
    .isEmail().withMessage('Please enter a valid email address in the format name@example.com.')
    .isLength({ max: 254 }).withMessage('Email address is too long.')
    .normalizeEmail(),

  body('github')
    .optional({ checkFalsy: true })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('GitHub URL must be a valid HTTPS URL (e.g. https://github.com/username).'),

  body('linkedin')
    .optional({ checkFalsy: true })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('LinkedIn URL must be a valid HTTPS URL (e.g. https://linkedin.com/in/username).'),

  body('role')
    .notEmpty().withMessage('Please select a role that best describes your profile.')
    .isIn(['Student', 'Developer', 'Maintainer', 'Contributor', 'Designer', 'Other'])
    .withMessage('Please select a valid role from the list.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must contain at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match. Please verify both password entries.');
      }
      return true;
    }),
];

// Login validation pipeline
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// Routes
router.post('/register', authLimiter, sanitizer, registerValidation, authController.register);
router.post('/login', authLimiter, sanitizer, loginValidation, authController.login);

module.exports = router;
