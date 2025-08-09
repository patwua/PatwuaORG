const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // profile fields
    slug: { type: String, unique: true, index: true, sparse: true },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    categories: { type: [String], default: [] },
  },
  { timestamps: true }
)

UserSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.passwordHash)
}

// Ensure a stable slug (first set = from name; can be edited later)
UserSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    this.slug = base || `user-${this._id}`
  }
  next()
})

module.exports = mongoose.model('User', UserSchema)

