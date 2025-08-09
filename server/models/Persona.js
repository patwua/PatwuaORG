const mongoose = require('mongoose')

const PersonaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' }, // URL for now
    isDefault: { type: Boolean, default: false },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

// enforce single default per owner
PersonaSchema.index({ ownerUserId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } })

module.exports = mongoose.model('Persona', PersonaSchema)
