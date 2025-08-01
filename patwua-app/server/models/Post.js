const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  fullContent: { type: String },
  author: { type: String, required: true },
  authorAvatar: { type: String },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  votes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  tags: [{ type: String }],
  imageUrl: { type: String },
  videoUrl: { type: String },
  imageSize: { type: String, enum: ['none', 'small', 'medium', 'large'], default: 'none' },
  isPromo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
