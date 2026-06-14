const projectService = require('../services/projectService');
const { validationResult } = require('express-validator');

const VALID_STATUSES = ['ongoing', 'complete', 'drop idea'];

exports.getProjects = async (req, res) => {
  try {
    const projects = await projectService.getAllProjects();
    res.status(200).json({ success: true, message: 'Projects retrieved', data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', errors: [error.message] });
  }
};

exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json({ success: true, message: 'Project created successfully', data: { project } });
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ success: false, message: error.message, errors: [error.message] });
    }
    res.status(500).json({ success: false, message: 'Server Error', errors: [error.message] });
  }
};

exports.updateProjectStatus = async (req, res) => {
  const { projectId } = req.params;
  const { ownerId, status } = req.body;

  if (!ownerId || !status) {
    return res.status(400).json({ success: false, message: 'ownerId and status are required', errors: [] });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      errors: []
    });
  }

  try {
    const project = await projectService.updateProjectStatus(projectId, ownerId, status);
    res.status(200).json({ success: true, message: 'Project status updated', data: { project } });
  } catch (error) {
    if (error.message.startsWith('Forbidden')) {
      return res.status(403).json({ success: false, message: error.message, errors: [] });
    }
    if (error.message === 'Project not found') {
      return res.status(404).json({ success: false, message: error.message, errors: [] });
    }
    res.status(500).json({ success: false, message: 'Server Error', errors: [error.message] });
  }
};

