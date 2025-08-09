// Admin-managed personas; readable by all authenticated users
const express = require('express')
const Persona = require('../models/Persona')
const { authRequired } = require('../middleware/auth')
const { adminOnly } = require('../middleware/adminOnly')

const router = express.Router()

// GET /api/personas  (any authed user can list; admins will see theirs; non-admins see public list)
router.get('/', authRequired, async (req, res) => {
  try {
    // for now: return all personas (or you can scope to ownerUserId if you want per-admin isolation)
    const items = await Persona.find().sort({ updatedAt: -1 }).lean()
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to list personas' })
  }
})

// POST /api/personas  (admin)
router.post('/', authRequired, adminOnly, async (req, res) => {
  try {
    const { name, bio, avatar, isDefault } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name required' })

    if (isDefault) {
      // unset other defaults for this owner
      await Persona.updateMany({ ownerUserId: req.user.id, isDefault: true }, { $set: { isDefault: false } })
    }

    const persona = await Persona.create({
      name, bio: bio || '', avatar: avatar || '', isDefault: !!isDefault, ownerUserId: req.user.id
    })
    res.status(201).json(persona)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create persona' })
  }
})

// PATCH /api/personas/:id  (admin)
router.patch('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { name, bio, avatar, isDefault } = req.body || {}

    if (isDefault) {
      await Persona.updateMany({ ownerUserId: req.user.id, isDefault: true }, { $set: { isDefault: false } })
    }

    const persona = await Persona.findByIdAndUpdate(
      id,
      { $set: { ...(name !== undefined && { name }), ...(bio !== undefined && { bio }), ...(avatar !== undefined && { avatar }), ...(isDefault !== undefined && { isDefault: !!isDefault }) } },
      { new: true }
    )
    if (!persona) return res.status(404).json({ error: 'Not found' })
    res.json(persona)
  } catch {
    res.status(500).json({ error: 'Failed to update persona' })
  }
})

// DELETE /api/personas/:id  (admin)
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const persona = await Persona.findByIdAndDelete(id)
    if (!persona) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete persona' })
  }
})

module.exports = router
