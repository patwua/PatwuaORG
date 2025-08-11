const STOP = new Set([
  'style','font','px','div','span','table','td','tr','br','color','size',
  'img','src','http','https','width','height','left','right','center','block',
  '0','0px','1px','2px','3px','4px','5px'
]);

function normalizeTag(t = '') {
  const k = String(t).toLowerCase().trim()
    .replace(/^#+/, '')
    .replace(/[#.,:;()<>\/\\'"!?]/g, ' ')
    .replace(/\s+/g, ' ');
  const parts = k.split(' ').filter(Boolean);
  const out = parts.join('-');
  if (!out || out.length < 2) return null;
  if (STOP.has(out)) return null;
  if (!/^[a-z0-9-]+$/.test(out)) return null;
  return out.slice(0, 40);
}

function normalize(arr = []) {
  const set = new Set();
  for (const raw of arr) {
    const t = normalizeTag(raw);
    if (t) set.add(t);
  }
  return Array.from(set).slice(0, 12);
}

function extractHashtagsFromHtml(html = '') {
  const matches = html.match(/#[A-Za-z0-9][A-Za-z0-9_-]{1,30}/g) || [];
  return normalize(matches.map(s => s.replace(/^#/, '')));
}

function extractHashtagsFromText(text = '') {
  const matches = text.match(/#[A-Za-z0-9][A-Za-z0-9_-]{1,30}/g) || [];
  return normalize(matches.map(s => s.replace(/^#/, '')));
}

module.exports = { normalize, normalizeTag, extractHashtagsFromHtml, extractHashtagsFromText };
