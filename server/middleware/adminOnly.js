module.exports = function adminOnly(req, res, next) {
  const role = req.user?.role;
  if (role === 'system_admin' || role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden' });
};
