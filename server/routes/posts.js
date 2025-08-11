const express = require('express');
const Post = require('../models/Post');
const Persona = require('../models/Persona');
const PostDraft = require('../models/PostDraft');
const auth = require('../middleware/auth');
const runTagAI = require('../utils/tagAI');
const { sanitize, compileMjml, stripToText, detectFormat, extractMedia, chooseCover } = require('../utils/html');
const { normalize } = require('../utils/tags');
const cheerio = require('cheerio');
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

/**
 * PREVIEW — compile MJML, sanitize HTML, extract media, suggest cover.
 * Body: { content: string }
 * Returns: { format, html, media: {images[], videos[]}, coverSuggested }
 */
router.post('/preview', auth(true), async (req, res, next) => {
  try {
    const { content = '' } = req.body || {};
    const fmt = detectFormat(content);

    let bodyHtml = '';
    if (fmt === 'mjml') {
      const compiled = compileMjml(content);
      bodyHtml = sanitize(compiled);
    } else if (fmt === 'html') {
      bodyHtml = sanitize(content);
    } else {
      return res.status(400).json({ error: 'Provide HTML or MJML for preview' });
    }

    const m = extractMedia(bodyHtml);
    const coverSuggested = chooseCover(m);

    res.json({
      format: fmt,
      html: bodyHtml,
      media: m,
      coverSuggested,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * CREATE — single content field; auto-detect format; optional coverImage override
 * Body: { title, content, tags?, coverImage? }
 */
router.post('/', auth(true), async (req, res, next) => {
  try {
    const { title, content = '', tags = [], coverImage, personaId } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title required' });

    const fmt = detectFormat(content);
    const roleType = Post.resolveTypeForRole(req.user.role);

    let bodyText = '';
    let bodyHtml;

    if (fmt === 'mjml') {
      const compiled = compileMjml(content);
      bodyHtml = sanitize(compiled);
      bodyText = stripToText(bodyHtml).slice(0, 800);
    } else if (fmt === 'html') {
      bodyHtml = sanitize(content);
      bodyText = stripToText(bodyHtml).slice(0, 800);
    } else {
      return res.status(400).json({ error: 'Content must be HTML or MJML' });
    }

    // Extract media & choose cover unless overridden
    let cover = coverImage || null;
    let media = [];
    if (bodyHtml) {
      const m = extractMedia(bodyHtml);
      media = [
        ...m.images.map(i => ({ kind: 'image', url: i.url, alt: i.alt, width: i.width, height: i.height })),
        ...m.videos.map(v => ({ kind: 'video', url: v.url, poster: v.poster })),
      ];
      if (!cover) cover = chooseCover(m);
    }

    // persona (explicit or default)
    let persona = null;
    if (personaId) {
      persona = await Persona.findOne({ _id: personaId, ownerUserId: req.user.id }).lean();
    } else {
      persona = await Persona.findOne({ ownerUserId: req.user.id, isDefault: true }).lean();
    }

    // tags (user + AI suggestions)
    let suggestions = [];
    try {
      suggestions = await runTagAI({ title, body: bodyText, html: bodyHtml });
    } catch {}
    const userTags = Array.isArray(tags) ? tags : [];
    const aiTags = Array.isArray(suggestions) ? suggestions : [];
    const finalTags = normalize([...userTags, ...aiTags]);

    const doc = await Post.create({
      title,
      body: bodyText,
      bodyHtml,
      format: fmt,
      author: req.user.id,
      type: roleType,
      tags: finalTags,
      coverImage: cover || undefined,
      media,
    });

    // Replace CTA token with the real post URL
    if (bodyHtml) {
      const $ = cheerio.load(bodyHtml);
      $('a[href="[[POST_URL]]"], a[data-cta="join"]').each((_, el) => {
        const url = `${SITE}/p/${doc.slug}`;
        $(el).attr('href', url);
        $(el).attr('target', '_self');
        $(el).attr('rel', 'noopener');
      });
      bodyHtml = $.html();
      await Post.findByIdAndUpdate(doc._id, { bodyHtml });
    }

    // async tag AI
    setImmediate(async () => {
      try {
        const suggestions = await runTagAI({ title, body: bodyText, html: bodyHtml });
        if (Array.isArray(suggestions) && suggestions.length) {
          await Post.findByIdAndUpdate(doc._id, { $addToSet: { tags: { $each: suggestions } } });
        }
      } catch {}
    });

    res.status(201).json({ post: doc });
  } catch (e) {
    next(e);
  }
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
      persona = await Persona.findOne({ _id: personaId, user: req.user.id }).lean();
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
        const compiled = compileMjml(draft.content);
        post.bodyHtml = sanitize(compiled);
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

      // media + cover (unless override)
      const m = extractMedia(post.bodyHtml);
      post.media = [
        ...m.images.map(i => ({ kind:'image', url:i.url, alt:i.alt, width:i.width, height:i.height })),
        ...m.videos.map(v => ({ kind:'video', url:v.url, poster:v.poster })),
      ];
      if (!draft.coverImage) {
        post.coverImage = chooseCover(m) || undefined;
      }
    }

    // cover override
    if (draft.coverImage !== undefined) post.coverImage = draft.coverImage || undefined;

    // tags
    if (draft.tags) post.tags = normalize(draft.tags);

    post.editedAt = new Date();
    post.editedBy = req.user.id;
    await post.save();

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
