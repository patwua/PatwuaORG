const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    image: String,
    role: {
      type: String,
      enum: [
        'user',
        'moderator',
        'verified_influencer',
        'verified_publisher',
        'advertiser',
        'admin',
        'system_admin',
      ],
      default: 'user',
    },
    verified: {
      status: { type: Boolean, default: false },
      role: { type: String, enum: ['influencer', 'publisher', null], default: null },
      verifiedAt: Date,
      verifiedBy: String,
      reason: String,
    },
    // profile fields
    slug: { type: String, unique: true, index: true, sparse: true },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    categories: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Ensure a stable slug (first set = from name; can be edited later)
UserSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    this.slug = base || `user-${this._id}`;
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
