const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona' },
  personaName: String,
  personaAvatar: String,
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['visible','hidden'], default: 'visible' },
}, { timestamps: true });

CommentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
