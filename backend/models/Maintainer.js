const mongoose = require('mongoose');

const maintainerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  role: { type: String, default: 'maintainer' },
}, { timestamps: true });

module.exports = mongoose.model('Maintainer', maintainerSchema);
