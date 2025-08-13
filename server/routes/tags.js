const express = require('express')
const Post = require('../models/Post')
const { normalizeTag } = require('../utils/tags')

const router = express.Router()

// GET /api/tags/trending?limit=&sinceDays=
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10)
    const sinceDays = parseInt(req.query.sinceDays, 10) || 7
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

    const tags = await Post.aggregate([
      { $match: { status: 'active', createdAt: { $gte: since }, tags: { $exists: true, $ne: [] } } },
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


// GET /api/tags/:tag?limit=
router.get('/:tag', async (req, res, next) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 50)
    const raw = String(req.params.tag || '')
    const t = normalizeTag(raw)
    if (!t) return res.json({ tag: t, posts: [] })
    const posts = await Post.find({ status: 'active', tags: t })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    res.json({ tag: t, posts })
  } catch (e) { next(e) }
})

module.exports = router
