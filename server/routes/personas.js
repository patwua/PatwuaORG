// Admin-managed personas; readable by all authenticated users
const express = require('express')
const Persona = require('../models/Persona')
const auth = require('../middleware/auth')
const adminOnly = require('../middleware/adminOnly')

const router = express.Router()

// GET /api/personas  (any authed user can list; admins will see theirs; non-admins see public list)
router.get('/', auth(), async (req, res) => {
  try {
    const filter = req.query.owner === 'me' ? { ownerUserId: req.user.id } : {}
    const items = await Persona.find(filter).sort({ updatedAt: -1 }).lean()
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to list personas' })
  }
})

// POST /api/personas  (admin)
router.post('/', auth(), adminOnly, async (req, res) => {
  try {
    const { name, bio, avatar, isDefault, kind } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name required' })

    if (isDefault) {
      // unset other defaults for this owner
      await Persona.updateMany({ ownerUserId: req.user.id, isDefault: true }, { $set: { isDefault: false } })
    }

    const persona = await Persona.create({
      name,
      bio: bio || '',
      avatar: avatar || '',
      isDefault: !!isDefault,
      ownerUserId: req.user.id,
      kind: ['news','vip','ads'].includes(kind) ? kind : 'post'
    })
    res.status(201).json(persona)
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Persona name already exists' })
    res.status(500).json({ error: 'Failed to create persona' })
  }
})

// PATCH /api/personas/:id  (admin)
router.patch('/:id', auth(), adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { name, bio, avatar, isDefault, kind } = req.body || {}

    if (isDefault) {
      await Persona.updateMany({ ownerUserId: req.user.id, isDefault: true }, { $set: { isDefault: false } })
    }

    const $set = {
      ...(bio !== undefined && { bio }),
      ...(avatar !== undefined && { avatar }),
      ...(isDefault !== undefined && { isDefault: !!isDefault }),
      ...(kind !== undefined && { kind: ['news','vip','ads'].includes(kind) ? kind : 'post' })
    }
    if (name !== undefined) { $set.name = name; $set.nameLower = String(name).toLowerCase().trim() }

    const persona = await Persona.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true })
    if (!persona) return res.status(404).json({ error: 'Not found' })
    res.json(persona)
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'Persona name already exists' })
    res.status(500).json({ error: 'Failed to update persona' })
  }
})

// DELETE /api/personas/:id  (admin)
router.delete('/:id', auth(), adminOnly, async (req, res) => {
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
