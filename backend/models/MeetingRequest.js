const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  requesterId: { type: String, required: true }, // References User.userId
  recipientId: { type: String, required: true }, // References User.userId
  projectId: { type: String, required: true }, // References Project.projectId
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  message: { type: String },
  scheduledDate: { type: Date },
}, { timestamps: true });

// Create indexes
meetingRequestSchema.index({ requestId: 1 });
meetingRequestSchema.index({ requesterId: 1 });
meetingRequestSchema.index({ recipientId: 1 });
meetingRequestSchema.index({ projectId: 1 });
meetingRequestSchema.index({ status: 1 });

module.exports = mongoose.model('MeetingRequest', meetingRequestSchema);
