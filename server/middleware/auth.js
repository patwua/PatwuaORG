const jwt = require('jsonwebtoken');

module.exports = function auth(required = true) {
  return (req, res, next) => {
    try {
      const token =
        req.cookies?.token ||
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.slice(7)
          : null);

      if (!token) {
        if (required) return res.status(401).json({ error: 'Unauthorized' });
        req.user = null;
        return next();
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      return next();
    } catch (e) {
      if (required) return res.status(401).json({ error: 'Unauthorized' });
      req.user = null;
      return next();
    }
  };
};
