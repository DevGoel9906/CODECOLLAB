const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const { body } = require('express-validator');

// GET all users
router.get('/', userController.getUsers);

// POST new user
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  userController.createUser
);

module.exports = router;
