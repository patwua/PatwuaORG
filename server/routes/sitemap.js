const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const origin = `${req.protocol}://${req.get('host')}`;
    const posts = await Post.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(500)
      .select('slug updatedAt createdAt')
      .lean();
    const users = await User.find({ handle: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 })
      .limit(500)
      .select('handle updatedAt createdAt')
      .lean();
    const urls = [];
    for (const p of posts) {
      const loc = `${origin}/p/${p.slug}`;
      const lastmod = (p.updatedAt || p.createdAt).toISOString();
      urls.push(`<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`);
    }
    for (const u of users) {
      const loc = `${origin}/@${u.handle}`;
      const lastmod = (u.updatedAt || u.createdAt).toISOString();
      urls.push(`<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`);
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>`+
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (e) {
    res.status(500).send('');
  }
});

router.get('/robots.txt', (req, res) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`);
});

module.exports = router;
