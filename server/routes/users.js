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

module.exports = router;
