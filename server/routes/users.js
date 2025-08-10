const express = require('express')
const User = require('../models/User')
const Persona = require('../models/Persona')
const auth = require('../middleware/auth')
const adminOnly = require('../middleware/adminOnly')

const router = express.Router()

// Public profile by slug
router.get('/:slug', async (req, res) => {
  const u = await User.findOne({ slug: req.params.slug }).lean()
  if (!u) return res.status(404).json({ error: 'User not found' })
  // expose public fields only
  const { _id, name, image, bio, location, categories, verified, createdAt } = u
  res.json({ id: _id, slug: req.params.slug, name, image, bio, location, categories, verified, createdAt })
})

// Public: list personas owned by this user
router.get('/:slug/personas', async (req, res) => {
  const u = await User.findOne({ slug: req.params.slug }).lean()
  if (!u) return res.status(404).json({ error: 'User not found' })
  const items = await Persona.find({ ownerUserId: u._id }).lean()
  res.json(items)
})

// Self profile
router.get('/me/profile', auth(), async (req, res) => {
  let u = await User.findById(req.user.id)
  if (!u) return res.status(404).json({ error: 'User not found' })
  if (!u.slug) {
    const base = (u.name || 'user')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    let slug = base || `user-${u._id.toString().slice(-6)}`
    // ensure uniqueness
    let i = 1
    while (await User.findOne({ slug })) {
      slug = `${base}-${i++}`
    }
    u.slug = slug
    await u.save()
  }
  const { _id, email, name, image, bio, location, categories, role, slug, verified } = u.toObject()
  res.json({ id: _id, email, name, image, bio, location, categories, role, slug, verified })
})

// Update self
router.patch('/me/profile', auth(), async (req, res) => {
  const { name, image, bio, location, categories, slug } = req.body || {}
  const allowed = {}
  if (name !== undefined) allowed.name = name
  if (image !== undefined) allowed.image = image
  if (bio !== undefined) allowed.bio = bio
  if (location !== undefined) allowed.location = location
  if (categories !== undefined) allowed.categories = categories
  // allow changing slug if unique
  if (slug !== undefined) allowed.slug = slug

  try {
    const updated = await User.findByIdAndUpdate(req.user.id, { $set: allowed }, { new: true, runValidators: true })
    if (!updated) return res.status(404).json({ error: 'User not found' })
    const { _id, email, role } = updated
    res.json({ id: _id, email, role, ...allowed, slug: updated.slug })
  } catch (e) {
    // likely duplicate slug
    return res.status(400).json({ error: 'Failed to update profile (slug may be taken)' })
  }
})

// List users (admin)
router.get('/admin', auth(true), adminOnly, async (req, res, next) => {
  try {
    const users = await User.find({}, 'name email role createdAt').sort({ createdAt: -1 }).lean()
    res.json({ users })
  } catch (e) {
    next(e)
  }
})

// Update role (admin)
router.patch('/admin/:id/role', auth(true), adminOnly, async (req, res, next) => {
  try {
    const { role } = req.body || {}
    const allowed = [
      'user',
      'moderator',
      'verified_influencer',
      'verified_publisher',
      'advertiser',
      'admin',
      'system_admin',
    ]
    if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' })

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    )
    if (!updated) return res.status(404).json({ error: 'User not found' })

    res.json({ user: { _id: updated._id, email: updated.email, role: updated.role } })
  } catch (e) {
    next(e)
  }
})

module.exports = router

