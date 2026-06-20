/**
 * controllers/userController.js
 *
 * Handles user listing and profile retrieval.
 * Passwords are hashed in the service layer — never stored plain,
 * never returned in any response.
 *
 * Note: Registration is now handled by authController.js
 */

const { validationResult } = require('express-validator');
const userService  = require('../services/userService');
const activityLog  = require('../services/activityLogService');

// ── GET /api/v1/users ─────────────────────────────────────────────────────────

exports.getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, message: 'Users retrieved.', data: users });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/users/:userId ─────────────────────────────────────────────────

exports.getUserById = async (req, res, next) => {
  const { userId } = req.params;

  // Validate format
  if (!/^USR-\d{6}$/.test(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format.',
    });
  }

  try {
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, message: 'User retrieved.', data: user });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/users ────────────────────────────────────────────────────────
// Legacy registration endpoint — prefer POST /api/v1/auth/register

exports.createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    activityLog.log(
      'anonymous',
      activityLog.ACTIONS.VALIDATION_FAILED,
      req.ip,
      'failure',
      `User registration validation failed: ${errors.array().map(e => e.msg).join('; ')}`
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
      `email: ${user.email}`
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user },
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
        message: 'An account with this email already exists. Try signing in instead.',
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
