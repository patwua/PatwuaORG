const express = require('express')
const Post = require('../models/Post')
const Persona = require('../models/Persona')
const User = require('../models/User')
const { authRequired } = require('../middleware/auth')
const { shortSlug } = require('../utils/slug')
const { extractTags } = require('../utils/tagAI')

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

// GET by slug + type: /api/posts/type/:type/slug/:slug
router.get('/type/:type/slug/:slug', async (req, res) => {
  try {
    const type = String(req.params.type)
    const slug = String(req.params.slug)
    const post = await Post.findOne({ type, slug, status: 'published' }).lean()
    if (!post) return res.status(404).json({ error: 'Not found' })
    const persona = await Persona.findById(post.personaId).lean()
    res.json({
      ...post,
      persona: persona ? { _id: persona._id, name: persona.name, avatar: persona.avatar } : null
    })
  } catch {
    res.status(500).json({ error: 'Failed to load post' })
  }
})

// GET /api/posts/:id  (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const post = await Post.findById(id).lean()
    if (!post || post.status !== 'published') return res.status(404).json({ error: 'Not found' })
    const [persona, author] = await Promise.all([
      Persona.findById(post.personaId).lean(),
      User.findById(post.authorUserId).lean()
    ])
    res.json({
      ...post,
      persona: persona ? { _id: persona._id, name: persona.name, avatar: persona.avatar } : null,
      author: author ? { _id: author._id, name: author.name, slug: author.slug } : null,
    })
  } catch {
    res.status(500).json({ error: 'Failed to load post' })
  }
})

// POST /api/posts  (create draft or submit/publish depending on role + action)
router.post('/', authRequired, async (req, res) => {
  try {
    const { title, body, personaId, action } = req.body || {}
    if (!title || title.trim().length < 3) return res.status(400).json({ error: 'Title too short' })
    if (!body || body.trim().length < 20) return res.status(400).json({ error: 'Body too short' })
    if (!personaId) return res.status(400).json({ error: 'personaId required' })

    const persona = await Persona.findById(personaId)
    if (!persona) return res.status(404).json({ error: 'Persona not found' })

    let status = 'draft'
    if (req.user.role === 'admin' && action === 'publish') status = 'published'
    else if (action === 'submit') status = 'pending_review'

    // decide type from persona.kind
    const type = ['news','vip','ads'].includes(persona.kind) ? persona.kind : 'post'
    // compute slug + path; ensure path uniqueness
    let slug = shortSlug(title || body)
    let path = `/${type}/${slug}`
    const collide = await Post.findOne({ path }).select('_id').lean()
    if (collide) {
      const suffix = Math.random().toString(36).slice(2, 7)
      slug = `${slug}-${suffix}`
      path = `/${type}/${slug}`
    }

    const post = await Post.create({
      title, body,
      tags: [],
      personaId,
      authorUserId: req.user.id,
      status,
      type, slug, path
    })

    // async tag enrichment (fire and forget)
    extractTags(`${title}\n\n${body}`).then(tags => {
      Post.findByIdAndUpdate(post._id, { tags: Array.from(new Set((tags||[]).slice(0,5))) }).catch(()=>{})
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

    // recompute slug/path only if not yet published
    if ((title !== undefined || body !== undefined) && post.status !== 'published') {
      const persona = await Persona.findById(post.personaId)
      const type = ['news','vip','ads'].includes(persona?.kind) ? persona.kind : 'post'
      let slug = shortSlug(post.title || post.body)
      let path = `/${type}/${slug}`
      const collide = await Post.findOne({ path, _id: { $ne: post._id } }).select('_id').lean()
      if (collide) {
        const suffix = Math.random().toString(36).slice(2, 7)
        slug = `${slug}-${suffix}`
        path = `/${type}/${slug}`
      }
      post.type = type
      post.slug = slug
      post.path = path
    }

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
