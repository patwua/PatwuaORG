const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const runTagAI = require('../utils/tagAI');
const { sanitize, compileMjml, stripToText, detectFormat, extractMedia, chooseCover } = require('../utils/html');

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
    // Accept one of: body (richtext), html, mjml … or just a single payload `content` and we detect.
    const { title, body, html, mjml, content, tags = [], format } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title required' });

    const roleType = Post.resolveTypeForRole(req.user.role);

    // Decide format/payload automatically when `format` is missing:
    const raw = content || html || mjml || body || '';
    const fmt = format || detectFormat(raw);

    let bodyText = body || '';
    let bodyHtml;

    if (fmt === 'mjml') {
      const compiled = compileMjml(content || mjml || raw);
      bodyHtml = sanitize(compiled);
      if (!bodyText) bodyText = stripToText(bodyHtml).slice(0, 800);
    } else if (fmt === 'html') {
      bodyHtml = sanitize(content || html || raw);
      if (!bodyText) bodyText = stripToText(bodyHtml).slice(0, 800);
    } else { // richtext
      if (!bodyText) return res.status(400).json({ error: 'Body required for richtext' });
    }

    // Extract media + cover
    let coverImage = null, media = [];
    if (bodyHtml) {
      const m = extractMedia(bodyHtml);
      coverImage = chooseCover(m);
      media = [
        ...m.images.map(i => ({ kind: 'image', url: i.url, alt: i.alt, width: i.width, height: i.height })),
        ...m.videos.map(v => ({ kind: 'video', url: v.url, poster: v.poster }))
      ];
    }

    const doc = await Post.create({
      title, body: bodyText, bodyHtml, format: fmt,
      author: req.user.id, type: roleType, tags, coverImage, media
    });

    // async tag AI (non-blocking)
    setImmediate(async () => {
      try {
        const suggestions = await runTagAI({ title, body: bodyText, html: bodyHtml });
        if (Array.isArray(suggestions) && suggestions.length) {
          await Post.findByIdAndUpdate(doc._id, { $addToSet: { tags: { $each: suggestions } } });
        }
      } catch {}
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
