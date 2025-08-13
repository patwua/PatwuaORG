const mongoose = require('mongoose');
const { shortSlug } = require('../utils/slug');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, index: true, unique: true, sparse: true },
  body: { type: String, required: true }, // plain text or editor text
  bodyHtml: { type: String },             // sanitized HTML (for html/mjml posts)
  format: { type: String, enum: ['richtext','html','mjml'], default: 'richtext' },
  coverImage: { type: String },
  media: [{
    kind: { type: String, enum: ['image','video'] },
    url: String,
    alt: String,
    width: Number,
    height: Number,
    poster: String,
  }],
  authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['news','vip','post','ads'], default: 'post' },
  status: { type: String, enum: ['active','archived'], default: 'active' },
  archivedReason: { type: String },
  archivedAt: { type: Date },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String, index: true }],
  summaryAI: { type: String },
  // legacy persona snapshot fields (unused but kept for now)
  personaName: { type: String },
  personaAvatar: { type: String },
}, { timestamps: true });

// ensure stable slug on first save only
PostSchema.pre('save', function(next) {
  if (!this.isModified('title') && this.slug) return next();
  if (!this.slug) {
    const base = shortSlug(this.title || '');
    const rand = Math.random().toString(36).slice(2, 6);
    this.slug = `${base}-${rand}`; // reduce collision risk
  }
  next();
});

// helper to map user.role -> post.type on create
PostSchema.statics.resolveTypeForRole = function(role) {
  if (role === 'verified_publisher') return 'news';
  if (role === 'verified_influencer') return 'vip';
  if (role === 'advertiser') return 'ads';
  return 'post';
};

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
