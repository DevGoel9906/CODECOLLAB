const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  ownerId: { type: String, required: true }, // References User.userId
  githubLink: { type: String },
  techStack: [{ type: String }],
  status: { type: String, enum: ['ongoing', 'complete', 'drop idea'], default: 'ongoing' },
}, { timestamps: true });

// Create indexes
projectSchema.index({ projectId: 1 });
projectSchema.index({ ownerId: 1 });
projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);
