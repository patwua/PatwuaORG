const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// get my profile
router.get('/me', auth(true), async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id).lean();
    res.json({
      user: {
        id: String(u._id),
        email: u.email,
        role: u.role,
        displayName: u.displayName,
        avatar: u.avatar || null,
        avatarUrl: u.avatarUrl || null
      }
    });
  } catch (e) { next(e); }
});

// update my profile
router.put('/me', auth(true), async (req, res, next) => {
  try {
    const { displayName, avatar, avatarUrl } = req.body || {};
    const update = {};
    if (typeof displayName === 'string') update.displayName = displayName.trim().slice(0, 80);
    if (typeof avatar === 'string') update.avatar = avatar.trim();
    if (typeof avatarUrl === 'string') update.avatarUrl = avatarUrl.trim();

    await User.updateOne({ _id: req.user.id }, { $set: update });
    const u = await User.findById(req.user.id).lean();
    res.json({
      user: {
        id: String(u._id),
        email: u.email,
        role: u.role,
        displayName: u.displayName,
        avatar: u.avatar || null,
        avatarUrl: u.avatarUrl || null
      }
    });
  } catch (e) { next(e); }
});

// set handle (one-time)
router.post('/handle', auth(true), async (req, res, next) => {
  try {
    const { handle, displayName } = req.body || {};
    const force = req.query.force === '1' && req.user.role === 'admin';

    const norm = String(handle || '').toLowerCase().trim();
    if (!/^[a-z0-9_.-]{3,30}$/.test(norm)) {
      return res.status(400).json({ error: 'Invalid handle' });
    }
    const reserved = ['admin','administrator','root','support','about','help','tag','tags','p','u','me','api','auth','static','assets'];
    if (reserved.includes(norm)) {
      return res.status(400).json({ error: 'Handle reserved' });
    }

    const user = await User.findById(req.user.id);
    if (user.handle && !force) {
      return res.status(400).json({ error: 'Handle already set' });
    }
    const existing = await User.findOne({ handle: norm });
    if (existing && String(existing._id) !== String(user._id)) {
      return res.status(400).json({ error: 'Handle taken' });
    }
    user.handle = norm;
    if (typeof displayName === 'string') user.displayName = displayName.trim();
    await user.save();
    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        handle: user.handle,
        displayName: user.displayName,
        avatar: user.avatar || null,
        avatarUrl: user.avatarUrl || null,
      }
    });
  } catch (e) { next(e); }
});

// lookup by handle
router.get('/by-handle/:handle', async (req, res, next) => {
  try {
    const h = String(req.params.handle || '').toLowerCase();
    const user = await User.findOne({ handle: h }).lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({
      user: {
        id: String(user._id),
        handle: user.handle,
        displayName: user.displayName || null,
        avatar: user.avatar || null,
        role: user.role,
      }
    });
  } catch (e) { next(e); }
});

module.exports = router;
