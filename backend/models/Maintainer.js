const mongoose = require('mongoose');

const maintainerSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // References User.userId
  projectId: { type: String, required: true }, // References Project.projectId
  role: { type: String, default: 'maintainer' },
}, { timestamps: true });

module.exports = mongoose.model('Maintainer', maintainerSchema);

