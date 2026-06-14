const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/projectController');
const { body } = require('express-validator');

// GET all projects
router.get('/', projectController.getProjects);

// POST new project
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').escape(),
    body('description').trim().notEmpty().withMessage('Description is required').escape(),
    body('ownerId').isString().notEmpty().withMessage('Valid owner ID is required'),
    body('githubLink').optional().isURL().withMessage('Must be a valid URL'),
    body('techStack').optional().isArray().withMessage('Tech stack must be an array'),
  ],
  projectController.createProject
);

// PATCH update project status (owner only)
router.patch(
  '/:projectId/status',
  [
    body('ownerId').isString().notEmpty().withMessage('ownerId is required'),
    body('status')
      .isString().notEmpty()
      .isIn(['ongoing', 'complete', 'drop idea'])
      .withMessage('Status must be one of: ongoing, complete, drop idea'),
  ],
  projectController.updateProjectStatus
);

module.exports = router;

