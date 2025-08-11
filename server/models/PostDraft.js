const mongoose = require('mongoose');

const PostDraftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true }, // editing an existing post
  title: String,
  content: String,           // raw HTML or MJML (original source)
  tags: [String],
  coverImage: String,        // override (optional)
  personaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona' },
  rev: { type: Number, default: 1 }, // simple optimistic concurrency
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // TTL anchor
}, { timestamps: true });

// TTL index: MongoDB will delete when expiresAt is reached
PostDraftSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// For quick lookup
PostDraftSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = mongoose.models.PostDraft || mongoose.model('PostDraft', PostDraftSchema);
