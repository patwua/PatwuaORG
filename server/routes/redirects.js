const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const PersonaRedirect = mongoose.models.PERSONA_REDIRECT || mongoose.model('PERSONA_REDIRECT', new mongoose.Schema({
  legacy: { type: String, index: true },
  handle: { type: String }
}, { collection: 'PersonaRedirects' }));

router.get('/u/:legacy', async (req, res, next) => {
  try {
    const legacy = String(req.params.legacy || '').toLowerCase();
    const doc = await PersonaRedirect.findOne({ legacy }).lean();
    if (!doc) return res.status(404).json({ error: 'Unknown legacy persona' });
    res.redirect(301, `/@${doc.handle}`);
  } catch (e) { next(e); }
});

module.exports = router;
