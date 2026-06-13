const mongoose = require('mongoose');

const meetingRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  message: { type: String },
  scheduledDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('MeetingRequest', meetingRequestSchema);
