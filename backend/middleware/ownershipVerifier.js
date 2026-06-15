/**
 * ownershipVerifier.js
 * Authorization Middleware — Ownership Verification
 *
 * Verifies that the ownerId in the request body matches
 * the actual owner of the project in the database.
 *
 * Must run AFTER sanitizer and requestVerifier.
 * Blocks unauthorized project mutations with 403 Forbidden.
 * Treats unauthorized access as a security event.
 */

const Project = require('../models/Project');

/**
 * Middleware: verifyProjectOwnership
 *
 * Loads the project from DB and confirms that req.body.ownerId
 * matches the stored project.ownerId.
 *
 * On mismatch → 403 + securityThreat: true (unauthorized ownership claim).
 * On project not found → 404.
 * On match → next().
 */
const verifyProjectOwnership = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { ownerId } = req.body;

    // Both must be present — prior middleware guarantees format validity
    if (!projectId || !ownerId) {
      return res.status(400).json({
        success: false,
        message: 'projectId and ownerId are required.',
      });
    }

    const project = await Project.findOne({ projectId }).select('ownerId projectId');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Ownership check
    if (project.ownerId !== ownerId) {
      console.warn(
        `[SECURITY] Unauthorized ownership claim | Claimed: ${ownerId} | Actual: ${project.ownerId} | Project: ${projectId} | IP: ${req.ip}`
      );
      return res.status(403).json({
        success: false,
        securityThreat: true,
        message: 'Suspicious or unauthorized activity was detected. Request blocked.',
      });
    }

    // Attach project to request so controller can use it without re-fetching
    req.verifiedProject = project;
    next();
  } catch (err) {
    console.error('[OwnershipVerifier] Error:', err.message);
    next(err);
  }
};

module.exports = { verifyProjectOwnership };
