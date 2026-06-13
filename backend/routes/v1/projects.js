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
    body('owner').isMongoId().withMessage('Valid owner ID is required'),
  ],
  projectController.createProject
);

module.exports = router;
