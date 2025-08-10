const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// POST /api/auth/google
// Body: { credential: string }  // Google ID token from @react-oauth/google
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) return res.status(400).json({ error: 'No email in Google profile' });

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        image: picture || null,
        role: ADMIN_EMAILS.includes(email) ? 'system_admin' : 'user',
      });
    }

    // Issue our JWT
    const token = jwt.sign(
      { sub: String(user._id), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // HttpOnly cookie for the SPA
    res.cookie('token', token, {
      httpOnly: true,
      // important for client<->server on different domains:
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: { id: user._id, email: user.email, name: user.name, image: user.image, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res.json({ ok: true });
});

module.exports = router;
