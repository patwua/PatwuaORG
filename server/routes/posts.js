const express = require('express');
const Post = require('../models/Post');
const Persona = require('../models/Persona');
const PostDraft = require('../models/PostDraft');
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');
const runTagAI = require('../utils/tagAI');
const { sanitize, compileMjml, stripToText, detectFormat, extractMedia, chooseCover } = require('../utils/html');
const { normalize, extractHashtagsFromHtml, extractHashtagsFromText } = require('../utils/tags');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const SITE = process.env.ALLOWED_ORIGIN || process.env.CLIENT_ORIGIN || '';
const router = express.Router();

function ttlDate() {
  const hours = Number(process.env.DRAFT_TTL_HOURS || 72);
  return new Date(Date.now() + hours * 3600 * 1000);
}

// List posts
router.get('/', async (req, res, next) => {
  try {
    const status = (req.query.status || 'active').toString();
    const posts = await Post.find({ status }).sort({ createdAt: -1 }).limit(50).lean();
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

// CREATE — single modal flow (title + body textarea) auto-detects
router.post('/', auth(true), async (req, res, next) => {
  try {
    const { title, content = '', body = '', coverImage, personaId } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title required' });

    // persona handling (safe fallback)
    const UserModel = require('../models/User');
    let personaDoc = null;
    if (personaId) {
      personaDoc = await Persona.findOne({ _id: personaId, ownerUserId: req.user.id }).lean().catch(() => null);
    }
    if (!personaDoc) {
      personaDoc = await Persona.findOne({ ownerUserId: req.user.id, isDefault: true }).lean();
    }
    let personaName = personaDoc?.name;
    let personaAvatar = personaDoc?.avatar;
    if (!personaDoc) {
      const u = await UserModel.findById(req.user.id).lean();
      personaName = u?.displayName || (u?.email ? u.email.split('@')[0] : 'Anonymous');
      personaAvatar = u?.avatar || u?.avatarUrl || u?.googleAvatar || null;
    }

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

    const type = Post.resolveTypeForRole(req.user.role);
    let postPayload = {
      title,
      body: bodyText,
      bodyHtml,
      sourceRaw: bodyHtml ? raw : undefined,
      format: fmt,
      author: req.user.id,
      type,
      coverImage: cover || undefined,
      media,
      tags: hashTags,
      personaId: personaDoc?._id || undefined,
      personaName,
      personaAvatar,
    };

    let doc = await Post.create(postPayload);

    // CTA token replacement: [[POST_URL]]
    if (doc.bodyHtml) {
      const SITE = process.env.ALLOWED_ORIGIN || process.env.CLIENT_ORIGIN || '';
      const $ = cheerio.load(doc.bodyHtml);
      $('a[href="[[POST_URL]]"], a[data-cta="join"]').each((_, el) => {
        $(el).attr('href', `${SITE}/p/${doc.slug}`).attr('target','_self').attr('rel','noopener');
      });
      await Post.findByIdAndUpdate(doc._id, { bodyHtml: $.html() });
    }

    // Hashtag tags (+ optional AI) → normalized and saved async
    setImmediate(async () => {
      try {
        const suggestions = await runTagAI({ title: doc.title, body: doc.body, html: doc.bodyHtml }) || [];
        const final = normalize([ ...hashTags, ...suggestions ]);
        await Post.findByIdAndUpdate(doc._id, { tags: final });
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

// Upsert vote
router.post('/:id/vote', auth(true), async (req, res, next) => {
  try {
    const { value } = req.body || {}; // -1, 0, 1
    if (![-1, 0, 1].includes(value)) return res.status(400).json({ error: 'Invalid vote' });
    const postId = req.params.id;

    await Vote.updateOne(
      { post: postId, user: req.user.id },
      { $set: { value } },
      { upsert: true }
    );

    const agg = await Vote.aggregate([
      { $match: { post: new mongoose.Types.ObjectId(postId) } },
      {
        $group: {
          _id: '$post',
          score: { $sum: '$value' },
          up: { $sum: { $cond: [{ $eq: ['$value', 1] }, 1, 0] } },
          down: { $sum: { $cond: [{ $eq: ['$value', -1] }, 1, 0] } },
        },
      },
    ]);
    const { score = 0, up = 0, down = 0 } = agg[0] || {};

    const mine = await Vote.findOne({ post: postId, user: req.user.id }).lean();
    res.json({ score, up, down, myVote: mine?.value ?? 0 });
  } catch (e) {
    next(e);
  }
});

// (optional) Get current tallies
router.get('/:id/votes', auth(false), async (req, res, next) => {
  try {
    const postId = req.params.id;
    const agg = await Vote.aggregate([
      { $match: { post: new mongoose.Types.ObjectId(postId) } },
      {
        $group: {
          _id: '$post',
          score: { $sum: '$value' },
          up: { $sum: { $cond: [{ $eq: ['$value', 1] }, 1, 0] } },
          down: { $sum: { $cond: [{ $eq: ['$value', -1] }, 1, 0] } },
        },
      },
    ]);
    const { score = 0, up = 0, down = 0 } = agg[0] || {};
    let myVote = 0;
    if (req.user) {
      const mine = await Vote.findOne({ post: postId, user: req.user.id }).lean();
      myVote = mine?.value ?? 0;
    }
    res.json({ score, up, down, myVote });
  } catch (e) {
    next(e);
  }
});

// list comments
router.get('/:id/comments', auth(false), async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id, status: 'visible' })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ comments });
  } catch (e) {
    next(e);
  }
});

// add comment
router.post('/:id/comments', auth(true), async (req, res, next) => {
  try {
    const { body, personaId } = req.body || {};
    if (!body || !String(body).trim()) return res.status(400).json({ error: 'Comment required' });
    const PersonaModel = require('../models/Persona');
    const UserModel = require('../models/User');
    let persona = null;
    if (personaId) {
      persona = await PersonaModel.findOne({ _id: personaId, ownerUserId: req.user.id }).lean().catch(() => null);
    }
    if (!persona) persona = await PersonaModel.findOne({ ownerUserId: req.user.id, isDefault: true }).lean();
    let personaName = persona?.name;
    let personaAvatar = persona?.avatar;
    if (!persona) {
      const u = await UserModel.findById(req.user.id).lean();
      personaName = u?.displayName || (u?.email ? u.email.split('@')[0] : 'Anonymous');
      personaAvatar = u?.avatar || u?.avatarUrl || u?.googleAvatar || null;
    }

    const c = await Comment.create({
      post: req.params.id,
      user: req.user.id,
      personaId: persona?._id,
      personaName,
      personaAvatar,
      body: String(body).trim(),
    });

    res.status(201).json({ comment: c });
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

    const canEdit = String(post.author) === String(req.user.id) || ['system_admin','admin'].includes(req.user.role);
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

    const { title, content, tags = [], coverImage, personaId, rev } = req.body || {};
    if (!content && !title && !tags && coverImage === undefined && !personaId) {
      return res.status(400).json({ error: 'Nothing to save' });
    }

    // Optional optimistic concurrency: if client passed rev, ensure match
    const existing = await PostDraft.findOne({ user: req.user.id, post: id });
    if (existing && rev && existing.rev !== rev) {
      return res.status(409).json({ error: 'Draft has changed elsewhere', currentRev: existing.rev });
    }

    // Validate persona ownership (if provided)
    let persona = null;
    if (personaId) {
      persona = await Persona.findOne({ _id: personaId, ownerUserId: req.user.id }).lean();
      if (!persona) return res.status(400).json({ error: 'Invalid persona' });
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
          personaId: persona?._id ?? existing?.personaId ?? post.personaId ?? null,
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
router.post('/:id/draft/publish', auth(true), async (req, res, next) => {
  try {
    const { id } = req.params;
    let draft = await PostDraft.findOne({ user: req.user.id, post: id });
    if (!draft) return res.status(404).json({ error: 'No draft' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const canEdit = String(post.author) === String(req.user.id) || ['system_admin','admin'].includes(req.user.role);
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

    // Title
    if (draft.title) post.title = draft.title;

    // Persona (optional)
    if (draft.personaId) post.personaId = draft.personaId;

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
      }

    // cover override
    if (draft.coverImage !== undefined) post.coverImage = draft.coverImage || undefined;

    const hashTags = post.bodyHtml ? extractHashtagsFromHtml(post.bodyHtml) : extractHashtagsFromText(post.body);
    const baseTags = Array.isArray(draft.tags) ? draft.tags : [];
    post.tags = normalize([ ...baseTags, ...hashTags ]);

    post.editedAt = new Date();
    post.editedBy = req.user.id;
    await post.save();

    setImmediate(async () => {
      try {
        const suggestions = await runTagAI({ title: post.title, body: post.body, html: post.bodyHtml }) || [];
        const final = normalize([ ...baseTags, ...hashTags, ...suggestions ]);
        await Post.findByIdAndUpdate(post._id, { tags: final });
      } catch {}
    });

    // Cleanup draft
    await PostDraft.deleteOne({ _id: draft._id });

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
