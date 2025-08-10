const mongoose = require('mongoose')

const PersonaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameLower: { type: String, required: true, unique: true, index: true }, // global unique (case-insensitive)
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' }, // URL for now
    isDefault: { type: Boolean, default: false },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // controls post routing
    kind: { type: String, enum: ['post','news','vip','ads'], default: 'post', index: true },
  },
  { timestamps: true }
)

// derive lowercase name for uniqueness
PersonaSchema.pre('validate', function (next) {
  if (this.name) this.nameLower = this.name.toLowerCase().trim()
  next()
})

// enforce single default per owner
PersonaSchema.index({ ownerUserId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } })

module.exports = mongoose.model('Persona', PersonaSchema)
