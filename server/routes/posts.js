const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const PostDraft = require('../models/PostDraft');
const auth = require('../middleware/auth');
const { sanitize, compileMjml, stripToText, detectFormat, extractMedia, chooseCover, rewriteJoinCTA } = require('../utils/html');
const { normalize, extractHashtagsFromHtml, extractHashtagsFromText } = require('../utils/tags');
const { rateLimitByUserOrIp } = require('../middleware/rateLimit');
const router = express.Router();
const attachAuthors = require('./attachAuthors');

const voteLimiter = rateLimitByUserOrIp({ windowMs: 60 * 1000, max: 60 });
const commentLimiter = rateLimitByUserOrIp({ windowMs: 10 * 60 * 1000, max: 20 });

function ttlDate() {
  const hours = Number(process.env.DRAFT_TTL_HOURS || 72);
  return new Date(Date.now() + hours * 3600 * 1000);
}

async function ensureHandleForPublish(req, res) {
  if (!req.user) return { ok: false, code: 401, body: { error: 'Unauthorized' } };
  const user = await User.findById(req.user.id).lean();
  if (!user) return { ok: false, code: 401, body: { error: 'Unauthorized' } };
  if (!user.handle) {
    return {
      ok: false,
      code: 409,
      body: { error: 'Handle required to publish', code: 'HANDLE_REQUIRED' },
    };
  }
  return { ok: true, user };
}

// List posts
router.get('/', auth(false), async (req, res, next) => {
  try {
    const status = (req.query.status || 'active').toString();
    const filter = { status };
    if (req.query.authorHandle) {
      const h = String(req.query.authorHandle).toLowerCase();
      const u = await User.findOne({ handle: h }).lean();
      if (!u) return res.json([]);
      filter.authorUserId = u._id;
    }
    const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    await attachAuthors(posts);
    for (const p of posts) {
      if (p.bodyHtml) p.bodyHtml = rewriteJoinCTA(p.bodyHtml, p.slug);
    }

    if (req.user) {
      const votes = await Vote.find({ userId: req.user.id, postId: { $in: posts.map(p => p._id) } }).lean();
      const map = {};
      for (const v of votes) map[String(v.postId)] = v.value;
      for (const p of posts) p.userVote = map[String(p._id)] || 0;
    } else {
      for (const p of posts) p.userVote = 0;
    }

    res.json(posts);
  } catch (e) { next(e); }
});

// PREVIEW — works with plain text, HTML, MJML
router.post('/preview', auth(true), async (req, res, next) => {
  try {
    const { content = '', body = '' } = req.body || {};
    const raw = content || body || '';
    const fmt = detectFormat(raw);

    let html = '';
    if (fmt === 'mjml') {
      try {
        const compiled = await compileMjml(raw);
        html = sanitize(compiled, { allowStyleTag: true });
      } catch (err) {
        return res.status(400).json({ error: 'MJML error: ' + String(err.message || err) });
      }
    } else if (fmt === 'html') html = sanitize(raw);
    else {
      const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
      const safe = esc(raw).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>');
      html = `<div class="post-plain"><p>${safe}</p></div>`;
    }

    const media = fmt !== 'richtext' ? extractMedia(html) : { images: [], videos: [] };
    const coverSuggested = fmt !== 'richtext' ? chooseCover(media) : null;

    res.json({ format: fmt, html, media, coverSuggested });
  } catch (e) { next(e); }
});

// CREATE — single modal flow (title + body textarea) auto-detects (auth required)
router.post('/', auth(true), async (req, res) => {
  try {
    const gate = await ensureHandleForPublish(req, res);
    if (!gate.ok) return res.status(gate.code).json(gate.body);
    const { title, content = '', body = '', coverImage } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title required' });

    // Prefer first non-empty field between `content` and `body`
    const raw = [content, body].find(v => typeof v === 'string' && v.trim()) || '';
    const fmt = detectFormat(raw);

    let bodyText = '';
    let bodyHtml = null;

    if (fmt === 'mjml') {
      try {
        const compiled = await compileMjml(raw);
        bodyHtml = sanitize(compiled, { allowStyleTag: true });
      } catch (err) {
        return res.status(400).json({ error: 'MJML error: ' + String(err.message || err) });
      }
      bodyText = stripToText(bodyHtml).slice(0, 800);
    } else if (fmt === 'html') {
      bodyHtml = sanitize(raw);
      bodyText = stripToText(bodyHtml).slice(0, 800);
    } else { // richtext

      if (!raw) return res.status(400).json({ error: 'Body required' });
      bodyText = String(raw);
    }

    // media + cover
    let media = [];
    let cover = coverImage || null;
    if (bodyHtml) {
      const m = extractMedia(bodyHtml);
      media = [
        ...m.images.map(i => ({ kind:'image', url:i.url, alt:i.alt, width:i.width, height:i.height })),
        ...m.videos.map(v => ({ kind:'video', url:v.url, poster:v.poster })),
      ];
      if (!cover) cover = chooseCover(m);
    }

    const hashTags = bodyHtml ? extractHashtagsFromHtml(bodyHtml) : extractHashtagsFromText(bodyText);
    const tags = normalize(hashTags);

    const type = Post.resolveTypeForRole(req.user.role);
    let postPayload = {
      title,
      body: bodyText,
      bodyHtml,
      sourceRaw: bodyHtml ? raw : undefined,
      format: fmt,
      authorUserId: req.user.id,
      type,
      coverImage: cover || undefined,
      media,
      tags,
    };

    let doc = await Post.create(postPayload);

    // CTA token replacement: [[POST_URL]] or data-cta="join"
    if (doc.bodyHtml) {
      const updated = rewriteJoinCTA(doc.bodyHtml, doc.slug);
      if (updated !== doc.bodyHtml) {
        await Post.findByIdAndUpdate(doc._id, { bodyHtml: updated });
        doc.bodyHtml = updated;
      }
    }

    await attachAuthors(doc);
    res.status(201).json({ post: doc });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

/**
 * Get by slug
 */
router.get('/slug/:slug', auth(false), async (req, res, next) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).lean();
    if (!post) return res.status(404).json({ error: 'Not found' });
    await attachAuthors(post);
    if (post.bodyHtml) post.bodyHtml = rewriteJoinCTA(post.bodyHtml, post.slug);
    if (req.user) {
      const mine = await Vote.findOne({ postId: post._id, userId: req.user.id }).lean();
      post.userVote = mine?.value ?? 0;
    } else post.userVote = 0;
    res.json({ post });
  } catch (e) { next(e); }
});

// Upsert vote (auth required)
router.post('/:id/vote', auth(true), voteLimiter, async (req, res, next) => {
  try {
    const { value } = req.body || {};
    if (![-1, 0, 1].includes(value)) return res.status(400).json({ error: 'Invalid vote' });
    const postId = req.params.id;

    const existing = await Vote.findOne({ postId, userId: req.user.id }).lean();
    let final = value;
    if (value === 0) {
      if (existing) await Vote.deleteOne({ _id: existing._id });
    } else if (!existing) {
      await Vote.create({ postId, userId: req.user.id, value });
    } else if (existing.value === value) {
      await Vote.deleteOne({ _id: existing._id });
      final = 0;
    } else {
      await Vote.updateOne({ _id: existing._id }, { $set: { value } });
    }

    const agg = await Vote.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId) } },
      {
        $group: {
          _id: '$postId',
          upvotes: { $sum: { $cond: [{ $eq: ['$value', 1] }, 1, 0] } },
          downvotes: { $sum: { $cond: [{ $eq: ['$value', -1] }, 1, 0] } },
        },
      },
    ]);
    const { upvotes = 0, downvotes = 0 } = agg[0] || {};
    const score = upvotes - downvotes;
    res.json({ ok: true, postId, upvotes, downvotes, score, userVote: final });
  } catch (e) {
    next(e);
  }
});

// (optional) Get current tallies
router.get('/:id/votes', auth(false), async (req, res, next) => {
  try {
    const postId = req.params.id;
    const agg = await Vote.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId) } },
      {
        $group: {
          _id: '$postId',
          upvotes: { $sum: { $cond: [{ $eq: ['$value', 1] }, 1, 0] } },
          downvotes: { $sum: { $cond: [{ $eq: ['$value', -1] }, 1, 0] } },
        },
      },
    ]);
    const { upvotes = 0, downvotes = 0 } = agg[0] || {};
    const score = upvotes - downvotes;
    let userVote = 0;
    if (req.user) {
      const mine = await Vote.findOne({ postId, userId: req.user.id }).lean();
      userVote = mine?.value ?? 0;
    }
    res.json({ ok: true, postId, upvotes, downvotes, score, userVote });
  } catch (e) {
    next(e);
  }
});

// list comments
router.get('/:id/comments', auth(false), async (req, res, next) => {
  try {
    const postId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const filter = { post: postId, status: 'visible' };
    const [total, docs] = await Promise.all([
      Comment.countDocuments(filter),
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    const authorIds = docs.map(c => c.authorUserId).filter(Boolean);
    const authors = await User.find({ _id: { $in: authorIds } })
      .select('_id handle displayName avatar')
      .lean();
    const map = {};
    for (const a of authors) {
      map[String(a._id)] = { id: String(a._id), handle: a.handle, displayName: a.displayName, avatar: a.avatar };
    }
    const items = docs.map(c => ({
      _id: String(c._id),
      body: c.body,
      createdAt: c.createdAt,
      author: map[String(c.authorUserId)] || null,
    }));
    const nextPage = page * limit < total ? page + 1 : null;
    res.json({ items, nextPage, total });
  } catch (e) {
    next(e);
  }
});

// add comment (auth required)
router.post('/:id/comments', auth(true), commentLimiter, async (req, res, next) => {
  try {
    const body = String(req.body?.body || '').trim();
    if (body.length < 1 || body.length > 5000) return res.status(400).json({ error: 'Invalid comment' });
    const postId = req.params.id;
    const c = await Comment.create({ post: postId, authorUserId: req.user.id, body });
    const author = await User.findById(req.user.id)
      .select('_id handle displayName avatar')
      .lean();
    const comment = {
      _id: String(c._id),
      body: c.body,
      createdAt: c.createdAt,
      author: author ? { id: String(author._id), handle: author.handle, displayName: author.displayName, avatar: author.avatar } : null,
    };
    res.status(201).json({ comment });
  } catch (e) {
    next(e);
  }
});

// Save/replace a draft for an existing post
router.put('/:id/draft', auth(true), async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).lean();
    if (!post) return res.status(404).json({ error: 'Not found' });

    const canEdit = String(post.authorUserId) === String(req.user.id) || ['system_admin','admin'].includes(req.user.role);
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

    const { title, content, tags = [], coverImage, rev } = req.body || {};
    if (!content && !title && !tags && coverImage === undefined) {
      return res.status(400).json({ error: 'Nothing to save' });
    }

    // Optional optimistic concurrency: if client passed rev, ensure match
    const existing = await PostDraft.findOne({ user: req.user.id, post: id });
    if (existing && rev && existing.rev !== rev) {
      return res.status(409).json({ error: 'Draft has changed elsewhere', currentRev: existing.rev });
    }

    const nextRev = (existing?.rev || 0) + 1;
    const draft = await PostDraft.findOneAndUpdate(
      { user: req.user.id, post: id },
      {
        $set: {
          title: title ?? existing?.title ?? post.title,
          content: content ?? existing?.content ?? '',
          tags: normalize(Array.isArray(tags) ? tags : existing?.tags ?? []),
          coverImage: coverImage !== undefined ? coverImage : (existing?.coverImage ?? post.coverImage ?? null),
          updatedAt: new Date(),
          expiresAt: ttlDate(),
          rev: nextRev,
        }
      },
      { upsert: true, new: true }
    ).lean();

    return res.json({ draft: { id: draft._id, rev: draft.rev, expiresAt: draft.expiresAt } });
  } catch (e) { next(e); }
});

// Get a draft for this post (if exists)
router.get('/:id/draft', auth(true), async (req, res, next) => {
  try {
    const { id } = req.params;
    const draft = await PostDraft.findOne({ user: req.user.id, post: id }).lean();
    if (!draft) return res.status(404).json({ error: 'No draft' });
    res.json({ draft });
  } catch (e) { next(e); }
});

// Discard draft
router.delete('/:id/draft', auth(true), async (req, res, next) => {
  try {
    const { id } = req.params;
    await PostDraft.deleteOne({ user: req.user.id, post: id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Publish draft: apply to live post and delete draft
router.post('/:id/draft/publish', auth(true), async (req, res) => {
  try {
    const gate = await ensureHandleForPublish(req, res);
    if (!gate.ok) return res.status(gate.code).json(gate.body);
    const { id } = req.params;
    let draft = await PostDraft.findOne({ user: req.user.id, post: id });
    if (!draft) return res.status(404).json({ error: 'No draft' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const canEdit = String(post.authorUserId) === String(req.user.id) || ['system_admin','admin'].includes(req.user.role);
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

    // Title
    if (draft.title) post.title = draft.title;

    // Content (compile/sanitize)
    if (draft.content) {
        const fmt = detectFormat(draft.content);
        if (fmt === 'mjml') {
          let compiled;
          try {
            compiled = await compileMjml(draft.content);
          } catch (err) {
            return res.status(400).json({ error: 'MJML error: ' + String(err.message || err) });
          }
          post.bodyHtml = sanitize(compiled, { allowStyleTag: true });
          post.body = stripToText(post.bodyHtml).slice(0, 800);
          post.format = 'mjml';
          post.sourceRaw = draft.content;
        } else if (fmt === 'html') {
          post.bodyHtml = sanitize(draft.content);
          post.body = stripToText(post.bodyHtml).slice(0, 800);
          post.format = 'html';
          post.sourceRaw = draft.content;
        } else {
          return res.status(400).json({ error: 'Draft must be HTML or MJML' });
        }
        if (post.bodyHtml) post.bodyHtml = rewriteJoinCTA(post.bodyHtml, post.slug);
      }

    // cover override
    if (draft.coverImage !== undefined) post.coverImage = draft.coverImage || undefined;

    const hashTags = post.bodyHtml ? extractHashtagsFromHtml(post.bodyHtml) : extractHashtagsFromText(post.body);
    const baseTags = Array.isArray(draft.tags) ? draft.tags : [];
    post.tags = normalize([ ...baseTags, ...hashTags ]);

    post.editedAt = new Date();
    post.editedBy = req.user.id;
    await post.save();

    // Cleanup draft
    await PostDraft.deleteOne({ _id: draft._id });

    await attachAuthors(post);
    res.json({ post });
  } catch (e) {
    req.log?.error?.(e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
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

    await attachAuthors(updated);
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

    const isAuthor = String(post.authorUserId) === String(req.user.id);
    const isSysAdmin = req.user.role === 'system_admin';
    if (!isAuthor && !isSysAdmin) return res.status(403).json({ error: 'Forbidden' });

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { status: 'active', archivedReason: null, archivedAt: null, archivedBy: null },
      { new: true }
    );
    await attachAuthors(updated);
    res.json({ post: updated });
  } catch (e) { next(e); }
});

// HARD DELETE a post and related records (admin/system_admin only, requires ?hard=true)
// DELETE /api/posts/:id?hard=true
router.delete('/:id', auth(true), async (req, res) => {
  try {
    const hard = String(req.query.hard).toLowerCase() === 'true';
    if (!hard) return res.status(400).json({ error: 'Use ?hard=true to permanently delete' });

    if (!req.user || !['admin', 'system_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const post = await Post.findById(id).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Cascade deletes
    await Promise.all([
      Comment.deleteMany({ post: id }),
      Vote.deleteMany({ postId: id }),
      PostDraft.deleteMany({ post: id }),
    ]);
    const { deletedCount } = await Post.deleteOne({ _id: id });

    return res.json({ ok: true, deletedPostId: id, deletedPost: !!deletedCount });
  } catch (e) {
    req.log?.error?.(e);
    return res.status(500).json({ error: 'Failed to hard delete post' });
  }
});

module.exports = router;
