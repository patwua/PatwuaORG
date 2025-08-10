const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const runTagAI = require('../utils/tagAI');
const { sanitize, compileMjml, stripToText } = require('../utils/html');

const router = express.Router();

// List posts
router.get('/', async (req, res, next) => {
  try {
    const status = (req.query.status || 'active').toString();
    const posts = await Post.find({ status }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(posts);
  } catch (e) { next(e); }
});

/**
 * Create post (richtext/html/mjml)
 * - type enforced by user.role (ignores client-provided type)
 * - triggers async tag AI (non-blocking)
 */
router.post('/', auth(true), async (req, res, next) => {
  try {
    const { title, body, html, mjml, tags = [], format } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title required' });

    const postType = Post.resolveTypeForRole(req.user.role);
    let bodyText = body || '';
    let bodyHtml;
    const fmt = format || 'richtext';

    if (fmt === 'html' && html) {
      bodyHtml = sanitize(html);
      if (!bodyText) bodyText = stripToText(bodyHtml).slice(0, 600);
    } else if (fmt === 'mjml' && mjml) {
      const compiled = compileMjml(mjml);
      bodyHtml = sanitize(compiled);
      if (!bodyText) bodyText = stripToText(bodyHtml).slice(0, 600);
    } else {
      // richtext fallback: ensure body exists
      if (!bodyText) return res.status(400).json({ error: 'Body required for richtext' });
    }

    const doc = await Post.create({
      title,
      body: bodyText,
      bodyHtml,
      format: fmt,
      author: req.user.id,
      type: postType,
      tags
    });

    setImmediate(async () => {
      try {
        const suggestions = await runTagAI({ title, body: bodyText, html: bodyHtml });
        if (Array.isArray(suggestions) && suggestions.length) {
          await Post.findByIdAndUpdate(doc._id, { $addToSet: { tags: { $each: suggestions } } });
        }
      } catch (_) {}
    });

    res.status(201).json({ post: doc });
  } catch (e) { next(e); }
});

/**
 * Get by slug
 */
router.get('/slug/:slug', auth(false), async (req, res, next) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate('author', 'name email role').lean();
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json({ post });
  } catch (e) { next(e); }
});

/**
 * Archive with mandatory reason (moderator/admin/system_admin)
 * - require min 5 words
 */
router.post('/:id/archive', auth(true), async (req, res, next) => {
  try {
    const role = req.user?.role;
    const allowed = ['moderator','admin','system_admin'];
    if (!allowed.includes(role)) return res.status(403).json({ error: 'Forbidden' });

    const { reason } = req.body || {};
    const wordCount = (reason || '').trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 5) return res.status(400).json({ error: 'Reason must be at least 5 words' });

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', archivedReason: reason, archivedAt: new Date(), archivedBy: req.user.id },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Post not found' });

    res.json({ post: updated });
  } catch (e) { next(e); }
});

/**
 * Unarchive (original author OR system_admin)
 */
router.post('/:id/unarchive', auth(true), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isAuthor = String(post.author) === String(req.user.id);
    const isSysAdmin = req.user.role === 'system_admin';
    if (!isAuthor && !isSysAdmin) return res.status(403).json({ error: 'Forbidden' });

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { status: 'active', archivedReason: null, archivedAt: null, archivedBy: null },
      { new: true }
    );
    res.json({ post: updated });
  } catch (e) { next(e); }
});

module.exports = router;
