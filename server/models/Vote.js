const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  value: { type: Number, enum: [-1, 0, 1], default: 0 },
}, { timestamps: true });

// ensure each user can vote once per post
VoteSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.models.Vote || mongoose.model('Vote', VoteSchema);
