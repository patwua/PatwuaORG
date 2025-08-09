const express = require('express')
const Post = require('../models/Post')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

// Guard: admin only for all routes here
router.use(authRequired, (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  next()
})

// GET /api/review/posts?status=pending_review
router.get('/posts', async (req, res) => {
  try {
    const status = (req.query.status || 'pending_review').toString()
    const items = await Post.find({ status })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to list review posts' })
  }
})

// PATCH /api/review/posts/:id/approve -> published
router.patch('/posts/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ error: 'Not found' })
    post.status = 'published'
    post.moderatorNote = ''
    post.reviewedByUserId = req.user.id
    post.reviewedAt = new Date()
    await post.save()
    res.json(post)
  } catch {
    res.status(500).json({ error: 'Failed to approve post' })
  }
})

// PATCH /api/review/posts/:id/reject -> draft
router.patch('/posts/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    const { note = '' } = req.body || {}
    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ error: 'Not found' })
    post.status = 'draft'
    post.moderatorNote = String(note || '')
    post.reviewedByUserId = req.user.id
    post.reviewedAt = new Date()
    await post.save()
    res.json(post)
  } catch {
    res.status(500).json({ error: 'Failed to reject post' })
  }
})

module.exports = router
