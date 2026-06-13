const maintainerService = require('../services/maintainerService');
const { validationResult } = require('express-validator');

exports.getMaintainers = async (req, res) => {
  try {
    const maintainers = await maintainerService.getAllMaintainers();
    res.status(200).json({ success: true, data: maintainers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createMaintainer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const maintainer = await maintainerService.createMaintainer(req.body);
    res.status(201).json({ success: true, data: maintainer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
