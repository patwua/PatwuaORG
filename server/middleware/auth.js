const jwt = require('jsonwebtoken');

module.exports = (required = false) => (req, res, next) => {
  try {
    const h = req.headers.authorization || '';
    let token = null;
    if (h.startsWith('Bearer ')) token = h.slice(7);
    if (!token) {
      if (required) return res.status(401).json({ error: 'Unauthorized' });
      return next();
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    if (required) return res.status(401).json({ error: 'Unauthorized' });
    next();
  }
};
