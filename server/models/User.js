const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true, index: true },
  role: { type: String, enum: ['user','verified','moderator','advertiser','admin','system_admin'], default: 'user' },
  displayName: String,
  avatar: String,
  avatarUrl: String,
  googleAvatar: String,
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
