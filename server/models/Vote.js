const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  value: { type: Number, enum: [-1, 0, 1], default: 0 },
}, { timestamps: true });

VoteSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.models.Vote || mongoose.model('Vote', VoteSchema);
