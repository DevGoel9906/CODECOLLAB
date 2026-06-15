/**
 * controllers/projectController.js
 *
 * All business logic gated behind the Zero Trust middleware pipeline.
 * Controllers only execute after: sanitization, ID verification,
 * ownership verification, and validation have all passed.
 *
 * Security threat responses are returned consistently:
 * { success: false, securityThreat: true, message: "..." }
 *
 * Activity is logged for every outcome — success and failure.
 */

const { validationResult } = require('express-validator');
const projectService   = require('../services/projectService');
const activityLog      = require('../services/activityLogService');

// ── GET /api/v1/projects ──────────────────────────────────────────────────────

exports.getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getAllProjects();
    res.status(200).json({ success: true, message: 'Projects retrieved.', data: projects });
  } catch (err) {
    next(err); // Global error handler strips internals
  }
};

// ── POST /api/v1/projects ─────────────────────────────────────────────────────

exports.createProject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    activityLog.log(
      req.body.ownerId || 'anonymous',
      activityLog.ACTIONS.VALIDATION_FAILED,
      req.ip,
      'failure',
      `Create project validation failed: ${errors.array().map(e => e.msg).join('; ')}`
    );
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const project = await projectService.createProject(req.body);

    activityLog.log(
      req.body.ownerId,
      activityLog.ACTIONS.PROJECT_CREATED,
      req.ip,
      'success',
      `projectId: ${project.projectId}`
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { project },
    });
  } catch (err) {
    // Service throws typed errors for known bad states
    if (err.code === 'INVALID_OWNER') {
      activityLog.log(
        req.body.ownerId || 'anonymous',
        activityLog.ACTIONS.SECURITY_THREAT_DETECTED,
        req.ip,
        'blocked',
        `Invalid ownerId on project create: ${req.body.ownerId}`
      );
      return res.status(400).json({
        success: false,
        securityThreat: true,
        message: 'Suspicious or unauthorized activity was detected. Request blocked.',
      });
    }
    next(err);
  }
};

// ── PATCH /api/v1/projects/:projectId/status ──────────────────────────────────
// Ownership has ALREADY been verified by ownershipVerifier middleware.
// Controller only needs to apply the status change.

exports.updateProjectStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { projectId } = req.params;
  const { ownerId, status } = req.body;

  try {
    const project = await projectService.updateProjectStatus(projectId, ownerId, status);

    activityLog.log(
      ownerId,
      activityLog.ACTIONS.PROJECT_STATUS_UPDATED,
      req.ip,
      'success',
      `projectId: ${projectId} → status: ${status}`
    );

    res.status(200).json({
      success: true,
      message: 'Project status updated.',
      data: { project },
    });
  } catch (err) {
    if (err.code === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    next(err);
  }
};
