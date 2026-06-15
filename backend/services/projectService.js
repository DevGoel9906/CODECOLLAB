/**
 * services/projectService.js
 *
 * Business logic layer. By this point, inputs have already been
 * sanitized and validated by the middleware pipeline.
 *
 * Services use typed error codes (err.code) so controllers can
 * pattern-match without inspecting raw message strings.
 * Raw Mongoose errors are never re-thrown — they go to errorHandler.
 */

const Project = require('../models/Project');
const User    = require('../models/User');
const { generateUniqueId } = require('../utils/idGenerator');

// ── Typed Error Factory ───────────────────────────────────────────────────────
const createError = (code, message, statusCode = 400) => {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
};

// ── Service Class ─────────────────────────────────────────────────────────────

class ProjectService {
  /**
   * Return all projects. MongoDB internals (_id, __v) are excluded.
   */
  async getAllProjects() {
    return await Project.find().select('-_id -__v').lean();
  }

  /**
   * Return a single project by projectId. Returns null if not found.
   */
  async getProjectById(projectId) {
    return await Project.findOne({ projectId }).select('-_id -__v').lean();
  }

  /**
   * Create a new project after verifying the owner exists.
   *
   * @throws INVALID_OWNER — ownerId does not correspond to any user
   */
  async createProject(projectData) {
    const { ownerId, description } = projectData;

    // Verify owner exists in the database
    const owner = await User.findOne({ userId: ownerId }).select('userId').lean();
    if (!owner) {
      throw createError('INVALID_OWNER', `No user found with ownerId: ${ownerId}`);
    }

    // Belt-and-suspenders word count (route validator already checks this, but
    // the service must never trust that validation ran)
    if (description) {
      const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 500) {
        throw createError('DESCRIPTION_TOO_LONG', 'Description must not exceed 500 words.');
      }
    }

    const projectId = await generateUniqueId('PRJ', Project, 'projectId');
    const project   = new Project({ ...projectData, projectId });
    await project.save();

    // Return plain object without MongoDB internals
    const projectObj = project.toObject();
    delete projectObj._id;
    delete projectObj.__v;
    return projectObj;
  }

  /**
   * Update project status.
   *
   * NOTE: Ownership has already been verified by ownershipVerifier middleware.
   * This method performs the update only — it no longer needs to re-check ownership.
   *
   * @throws PROJECT_NOT_FOUND — project does not exist
   */
  async updateProjectStatus(projectId, ownerId, status) {
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw createError('PROJECT_NOT_FOUND', 'Project not found.', 404);
    }

    project.status = status;
    await project.save();

    const projectObj = project.toObject();
    delete projectObj._id;
    delete projectObj.__v;
    return projectObj;
  }
}

module.exports = new ProjectService();
