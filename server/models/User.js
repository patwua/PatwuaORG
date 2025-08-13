const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true, index: true },
  role: { type: String, enum: ['user','verified','moderator','advertiser','admin','system_admin'], default: 'user' },
  handle: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  displayName: { type: String, trim: true },
  avatar: String,
  avatarUrl: String,
  googleAvatar: String,
}, { timestamps: true });

// ensure unique index on handle
UserSchema.index({ handle: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
