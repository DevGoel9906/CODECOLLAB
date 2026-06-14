const userService = require('../services/userService');
const { validationResult } = require('express-validator');

exports.getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, message: 'Users retrieved', data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', errors: [error.message] });
  }
};

exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, message: 'User created successfully', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', errors: [error.message] });
  }
};
