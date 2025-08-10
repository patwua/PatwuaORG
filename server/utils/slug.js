const slugify = require('slugify');
function shortSlug(text) {
  const base = slugify((text || 'untitled'), { lower: true, strict: true, trim: true })
    .split('-')
    .filter(Boolean)
    .slice(0, 5)
    .join('-');
  return base || 'post';
}
module.exports = { shortSlug };
