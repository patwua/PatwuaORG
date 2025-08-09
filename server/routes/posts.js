const express = require('express')
const Post = require('../models/Post')
const Persona = require('../models/Persona')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

// GET /api/posts?status=published  (public feed endpoint)
router.get('/', async (req, res) => {
  try {
    const status = (req.query.status || 'published').toString()
    const cursor = Post.find({ status })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    const items = await cursor
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to list posts' })
  }
})

// POST /api/posts  (create draft or submit/publish depending on role + action)
router.post('/', authRequired, async (req, res) => {
  try {
    const { title, body, tags = [], personaId, action } = req.body || {}
    if (!title || title.trim().length < 3) return res.status(400).json({ error: 'Title too short' })
    if (!body || body.trim().length < 20) return res.status(400).json({ error: 'Body too short' })
    if (!personaId) return res.status(400).json({ error: 'personaId required' })

    // ensure persona exists
    const persona = await Persona.findById(personaId)
    if (!persona) return res.status(404).json({ error: 'Persona not found' })

    let status = 'draft'
    if (req.user.role === 'admin' && action === 'publish') status = 'published'
    else if (action === 'submit') status = 'pending_review'

    const post = await Post.create({
      title, body, tags, personaId,
      authorUserId: req.user.id,
      status
    })

    res.status(201).json(post)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create post' })
  }
})

// PATCH /api/posts/:id  (update title/body/tags while draft or pending)
router.patch('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params
    const { title, body, tags } = req.body || {}
    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ error: 'Not found' })
    if (!['draft', 'pending_review'].includes(post.status)) {
      return res.status(400).json({ error: 'Only drafts or pending posts can be edited' })
    }
    if (post.authorUserId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (title !== undefined) post.title = title
    if (body  !== undefined) post.body  = body
    if (tags  !== undefined) post.tags  = tags
    await post.save()
    res.json(post)
  } catch {
    res.status(500).json({ error: 'Failed to update post' })
  }
})

// PATCH /api/posts/:id/submit  (author -> pending_review)
router.patch('/:id/submit', authRequired, async (req, res) => {
  try {
    const { id } = req.params
    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ error: 'Not found' })
    if (post.authorUserId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    post.status = 'pending_review'
    await post.save()
    res.json(post)
  } catch {
    res.status(500).json({ error: 'Failed to submit post' })
  }
})

// PATCH /api/posts/:id/publish  (admin only)
router.patch('/:id/publish', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
    const { id } = req.params
    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ error: 'Not found' })
    post.status = 'published'
    await post.save()
    res.json(post)
  } catch {
    res.status(500).json({ error: 'Failed to publish post' })
  }
})

module.exports = router
