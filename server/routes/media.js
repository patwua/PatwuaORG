const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { extractMedia } = require('../utils/html');

const router = express.Router();

router.get('/by-handle/:handle/media', async (req, res, next) => {
  try {
    const h = String(req.params.handle || '').toLowerCase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 30);
    const user = await User.findOne({ handle: h }).lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    const filter = { authorUserId: user._id, status: { $ne: 'archived' } };
    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const items = [];
    for (const p of posts) {
      const media = extractMedia(p.bodyHtml || '');
      media.images.forEach(img => {
        if (img.url) {
          items.push({
            type: 'image',
            url: img.url,
            width: img.width || undefined,
            height: img.height || undefined,
            post: { _id: String(p._id), slug: p.slug, title: p.title },
          });
        }
      });
      media.videos.forEach(v => {
        if (v.url) {
          items.push({
            type: 'video',
            url: v.url,
            post: { _id: String(p._id), slug: p.slug, title: p.title },
          });
        }
      });
    }
    const nextPage = page * limit < total ? page + 1 : null;
    res.json({ items, nextPage, total });
  } catch (e) { next(e); }
});

module.exports = router;
