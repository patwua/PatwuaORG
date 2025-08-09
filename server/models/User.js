const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
)

UserSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.passwordHash)
}

module.exports = mongoose.model('User', UserSchema)

