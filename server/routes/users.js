const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const HandleReservation = require('../models/HandleReservation');
const { normalizeHandle, proposeAndReserve, RESERVED } = require('../utils/handle');

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
        handle: u.handle || null,
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
        handle: u.handle || null,
        displayName: u.displayName,
        avatar: u.avatar || null,
        avatarUrl: u.avatarUrl || null
      }
    });
  } catch (e) { next(e); }
});

// suggest a handle and reserve it temporarily
router.get('/handle-suggestion', auth(true), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.handle) return res.json({ suggestion: user.handle, alreadySet: true });
  const suggestion = await proposeAndReserve(user, { seeds: [], days: Number(process.env.HANDLE_RESERVE_DAYS || 30) });
  res.json({ suggestion });
});

// claim a handle
router.post('/handle', auth(true), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { handle, displayName } = req.body || {};
  const force = String(req.query.force || '') === '1';
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.handle && !force) {
    return res.status(409).json({ error: 'Handle already set and immutable' });
  }

  const h = normalizeHandle(handle);
  if (!h || h.length < 3) return res.status(400).json({ error: 'Handle must be at least 3 characters' });
  if (RESERVED.has(h)) return res.status(400).json({ error: 'Handle is reserved' });

  const reservedByUser = await HandleReservation.findOne({ handle: h, userId: user._id });
  const claimedByOther = await User.exists({ handle: h });
  const reservedByOther = await HandleReservation.findOne({ handle: h, userId: { $ne: user._id } });

  if (claimedByOther) return res.status(409).json({ error: 'Handle already taken' });
  if (reservedByOther) return res.status(409).json({ error: 'Handle temporarily reserved by another user' });

  user.handle = h;
  if (typeof displayName === 'string') user.displayName = displayName;
  await user.save();
  if (reservedByUser) await HandleReservation.deleteOne({ _id: reservedByUser._id });

  const publicUser = { id: user._id, email: user.email, handle: user.handle, displayName: user.displayName, avatar: user.avatar || null, avatarUrl: user.avatarUrl || null, role: user.role };
  res.json({ user: publicUser });
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
