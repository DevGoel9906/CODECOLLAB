const Project = require('../models/Project');

class ProjectService {
  async getAllProjects() {
    return await Project.find().populate('owner', 'name email');
  }

  async getProjectById(id) {
    return await Project.findById(id).populate('owner', 'name email');
  }

  async createProject(projectData) {
    const project = new Project(projectData);
    return await project.save();
  }
}

module.exports = new ProjectService();
