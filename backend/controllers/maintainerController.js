/**
 * controllers/maintainerController.js
 *
 * Handles maintainer listing and creation with activity logging.
 */

const { validationResult } = require('express-validator');
const maintainerService = require('../services/maintainerService');
const activityLog       = require('../services/activityLogService');

// ── GET /api/v1/maintainers ───────────────────────────────────────────────────

exports.getMaintainers = async (req, res, next) => {
  try {
    const maintainers = await maintainerService.getAllMaintainers();
    res.status(200).json({ success: true, message: 'Maintainers retrieved.', data: maintainers });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/v1/maintainers ──────────────────────────────────────────────────

exports.createMaintainer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    activityLog.log(
      'anonymous',
      activityLog.ACTIONS.VALIDATION_FAILED,
      req.ip,
      'failure',
      `Maintainer creation validation failed: ${errors.array().map(e => e.msg).join('; ')}`
    );
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const maintainer = await maintainerService.createMaintainer(req.body);

    activityLog.log(
      'anonymous',
      activityLog.ACTIONS.MAINTAINER_ADDED,
      req.ip,
      'success',
      `user: ${req.body.user} | project: ${req.body.project}`
    );

    res.status(201).json({
      success: true,
      message: 'Maintainer added successfully.',
      data: { maintainer },
    });
  } catch (err) {
    next(err);
  }
};
