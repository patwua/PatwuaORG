const STOP = new Set(['style','font','px','div','span','0','0px','table','td','tr']);
exports.normalize = (arr = []) => {
  const out = [];
  for (const t of arr) {
    const k = String(t).toLowerCase().trim()
      .replace(/[#.,:;()<>\/\\'\"]/g, ' ')
      .replace(/\s+/g, ' ');
    k.split(' ').forEach(w => {
      if (w.length < 3) return;
      if (STOP.has(w)) return;
      if (!/^[a-z0-9-]+$/.test(w)) return;
      out.push(w);
    });
  }
  return [...new Set(out)].slice(0, 10);
};
