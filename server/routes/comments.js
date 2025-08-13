const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const filter = {};
    if (req.query.authorHandle) {
      const h = String(req.query.authorHandle).toLowerCase();
      const u = await User.findOne({ handle: h }).lean();
      if (!u) return res.json({ items: [], nextPage: null, total: 0 });
      filter.authorUserId = u._id;
    }
    const total = await Comment.countDocuments(filter);
    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('post', 'slug title')
      .lean();
    const items = comments.map(c => ({
      _id: String(c._id),
      body: c.body,
      createdAt: c.createdAt,
      post: c.post ? { _id: String(c.post._id), slug: c.post.slug, title: c.post.title } : null,
    }));
    const nextPage = page * limit < total ? page + 1 : null;
    res.json({ items, nextPage, total });
  } catch (e) { next(e); }
});

module.exports = router;
