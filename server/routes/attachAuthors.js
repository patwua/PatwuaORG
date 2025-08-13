const User = require('../models/User');

async function attachAuthors(posts) {
  const arr = Array.isArray(posts) ? posts : [posts];
  const ids = [...new Set(arr.map(p => p?.authorUserId).filter(Boolean).map(String))];
  if (ids.length === 0) return posts;
  const users = await User.find({ _id: { $in: ids } })
    .select({ _id: 1, handle: 1, displayName: 1, avatar: 1 })
    .lean();
  const map = new Map(users.map(u => [String(u._id), u]));
  arr.forEach(p => {
    const u = map.get(String(p.authorUserId));
    if (u) {
      p.author = {
        id: u._id,
        handle: u.handle || null,
        displayName: u.displayName || (u.handle ? '@' + u.handle : null),
        avatar: u.avatar || null,
      };
    } else {
      p.author = { id: null, handle: null, displayName: null, avatar: null };
    }
  });
  return Array.isArray(posts) ? posts : posts;
}

module.exports = attachAuthors;
