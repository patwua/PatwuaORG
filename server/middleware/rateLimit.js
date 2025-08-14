const rateLimit = require('express-rate-limit');

function rateLimitByUserOrIp(options) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.user?.id ? String(req.user.id) : req.ip),
    handler: (_req, res) => {
      res.status(429).json({ error: 'Too many requests, please slow down.' });
    },
    ...options,
  });
}

module.exports = { rateLimitByUserOrIp };
