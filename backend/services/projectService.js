const Project = require('../models/Project');
const User = require('../models/User');
const { generateUniqueId } = require('../utils/idGenerator');

class ProjectService {
  async getAllProjects() {
    return await Project.find().select('-_id -__v');
  }

  async getProjectById(projectId) {
    return await Project.findOne({ projectId }).select('-_id -__v');
  }

  async createProject(projectData) {
    // Validate owner exists
    const owner = await User.findOne({ userId: projectData.ownerId });
    if (!owner) {
      throw new Error('Invalid ownerId');
    }

    const projectId = await generateUniqueId('PRJ', Project, 'projectId');
    const project = new Project({ ...projectData, projectId });
    await project.save();

    const projectObj = project.toObject();
    delete projectObj._id;
    delete projectObj.__v;
    return projectObj;
  }

  async updateProjectStatus(projectId, ownerId, status) {
    // Find the project
    const project = await Project.findOne({ projectId });
    if (!project) {
      throw new Error('Project not found');
    }

    // Ownership check — only the owner can change status
    if (project.ownerId !== ownerId) {
      throw new Error('Forbidden: only the project owner can update status');
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
