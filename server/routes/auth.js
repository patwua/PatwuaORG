const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  const payload = { sub: String(user._id), role: user.role || 'user' };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const g = ticket.getPayload();
    if (!g?.email) return res.status(400).json({ error: 'Invalid Google token' });

    const email = g.email.toLowerCase();
    const googleAvatar = g.picture || null;
    const name = g.name || email.split('@')[0];

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        role: 'user',
        displayName: name,
        googleAvatar,
        avatar: googleAvatar
      });
    } else {
      const update = { googleAvatar };
      if (!user.avatar) update.avatar = googleAvatar;
      if (!user.displayName && name) update.displayName = name;
      await User.updateOne({ _id: user._id }, { $set: update });
      user = await User.findById(user._id);
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        handle: user.handle || null,
        displayName: user.displayName,
        avatar: user.avatar || null,
        avatarUrl: user.avatarUrl || null
      }
    });
  } catch (e) { next(e); }
});

module.exports = router;
