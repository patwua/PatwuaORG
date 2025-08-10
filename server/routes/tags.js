const express = require('express')
const Post = require('../models/Post')

const router = express.Router()

// GET /api/tags/trending?limit=&sinceDays=
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10)
    const sinceDays = parseInt(req.query.sinceDays, 10) || 7
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

    const tags = await Post.aggregate([
      { $match: { status: 'published', createdAt: { $gte: since }, tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: { $toLower: '$tags' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ])

    res.json(tags.map(t => ({ tag: t._id, count: t.count })))
  } catch {
    res.status(500).json({ error: 'Failed to load trending tags' })
  }
})

const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// GET /api/tags/:tag/posts?limit=
router.get('/:tag/posts', async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 50)
    const tag = String(req.params.tag)
    const regex = new RegExp(`^${escapeRegex(tag)}$`, 'i')

    const posts = await Post.find({
      status: 'published',
      tags: regex
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    res.json(posts)
  } catch {
    res.status(500).json({ error: 'Failed to load posts for tag' })
  }
})

module.exports = router
