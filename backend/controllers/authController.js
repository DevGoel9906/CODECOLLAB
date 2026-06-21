/**
 * controllers/authController.js
 *
 * Handles User Sign In and Sign Up/Registration flows.
 */

const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const activityLog = require('../services/activityLogService');

// Helper to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    activityLog.log(
      'anonymous',
      activityLog.ACTIONS.VALIDATION_FAILED,
      req.ip,
      'failure',
      `Registration validation failed: ${errors.array().map(e => e.msg).join('; ')}`
    );
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg || 'Validation failed. Please check your input.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const user = await userService.createUser(req.body);

    activityLog.log(
      user.userId,
      activityLog.ACTIONS.USER_REGISTERED,
      req.ip,
      'success',
      `Registered user: ${user.email}`
    );

    const token = generateToken(user.userId);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 'DUPLICATE_EMAIL') {
      activityLog.log(
        'anonymous',
        activityLog.ACTIONS.VALIDATION_FAILED,
        req.ip,
        'failure',
        'Duplicate email registration attempt.'
      );
      return res.status(409).json({
        success: false,
        message: err.message,
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this information already exists.',
      });
    }

    next(err);
  }
};

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required fields.',
    });
  }

  const { email, password } = req.body;

  try {
    const user = await userService.authenticateUser(email, password);

    activityLog.log(
      user.userId,
      'USER_LOGGED_IN',
      req.ip,
      'success',
      `Logged in user: ${user.email}`
    );

    const token = generateToken(user.userId);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      activityLog.log(
        'anonymous',
        'LOGIN_FAILED',
        req.ip,
        'failure',
        `Failed login attempt for email: ${email}`
      );
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};
