function extractTags(text, max = 5) {
  // TODO: plug a real model; for now super simple keyword pick
  const words = String(text || '').toLowerCase().match(/[a-z0-9-]{3,}/g) || [];
  const stop = new Set(['the','and','for','that','with','from','this','have','has','were','your','about','into','over','into','also','just','very']);
  const freq = new Map();
  for (const w of words) if (!stop.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  const tags = [...freq.entries()].sort((a,b) => b[1] - a[1]).slice(0, max).map(([w]) => w);
  return tags;
}

async function runTagAI({ title = '', body = '', html = '' } = {}) {
  const text = `${title}\n${body}\n${html}`;
  return extractTags(text);
}

module.exports = runTagAI;
module.exports.extractTags = extractTags;
