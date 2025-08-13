const mongoose = require('mongoose')

const HandleReservationSchema = new mongoose.Schema({
  handle: { type: String, required: true, lowercase: true, trim: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true })

// TTL index: Mongo will auto-delete after expiresAt
HandleReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.models.HandleReservation || mongoose.model('HandleReservation', HandleReservationSchema)
