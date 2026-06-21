const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String },
  email: { type: String, required: true, unique: true },
  github: { type: String },
  linkedin: { type: String },
  role: { type: String, default: 'Student' },
  passwordHash: { type: String, required: true },
  profileImage: { type: String },
}, { timestamps: true });

// Create indexes
userSchema.index({ userId: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);

