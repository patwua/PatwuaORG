const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body:  { type: String, required: true },
    tags:  { type: [String], default: [] },

    // attribution
    personaId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    authorUserId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // workflow
    status: { type: String, enum: ['draft', 'pending_review', 'published'], default: 'draft', index: true },

    // counters (for later)
    stats: {
      comments: { type: Number, default: 0 },
      votes:    { type: Number, default: 0 }
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Post', PostSchema)
