/**
 * controllers/userController.js
 *
 * Handles user registration and listing.
 * Passwords are hashed in the service layer — never stored plain,
 * never returned in any response.
 *
 * Duplicate key errors (email, userId) are caught here and
 * mapped to user-friendly messages without leaking DB internals.
 */

const { validationResult } = require('express-validator');
const userService  = require('../services/userService');
const activityLog  = require('../services/activityLogService');

// ── GET /api/v1/users ─────────────────────────────────────────────────────────

exports.getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers(); // passwords excluded in service
    res.status(200).json({ success: true, message: 'Users retrieved.', data: users });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/users ────────────────────────────────────────────────────────

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
      message: 'Validation failed. Please check your input.',
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
      data: { user }, // password is already stripped in service
    });
  } catch (err) {
    // Duplicate email
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
        message: 'An account with this email already exists.',
      });
    }

    // MongoDB duplicate key (catch-all for unique index violations)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this information already exists.',
      });
    }

    next(err);
  }
};
