const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body:  { type: String, required: true },
    tags:  { type: [String], default: [], index: true },

    // attribution
    personaId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    authorUserId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // workflow
    status: { type: String, enum: ['draft', 'pending_review', 'published'], default: 'draft', index: true },

    // routing
    type: { type: String, enum: ['post','news','vip','ads'], default: 'post', index: true },
    slug: { type: String, required: true, index: true },
    path: { type: String, required: true, unique: true },

    // counters (for later)
    stats: {
      comments: { type: Number, default: 0 },
      votes:    { type: Number, default: 0 }
    },
    // moderation metadata (optional)
    moderatorNote: { type: String, default: '' },
    reviewedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true }
)

PostSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Post', PostSchema)
