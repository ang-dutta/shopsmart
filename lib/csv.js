// Minimal RFC-4180 CSV reader/writer (quoted fields, escaped quotes, CRLF).
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  const keys = head.map((h) => h.replace(/^\ufeff/, '').trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ''])));
}

export function toCSV(rows, cols) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}

// Turns a raw CSV row (from the synthetic generator OR a user-supplied file) into the
// canonical product shape used everywhere else. Missing columns get sensible defaults.
export function normalizeProduct(row, i) {
  const category = (row.category || 'General').trim();
  const hue = [...category].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  return {
    id: (row.id || `P${String(i + 1).padStart(5, '0')}`).trim(),
    title: (row.title || row.name || '').trim(),
    description: (row.description || '').trim(),
    category,
    subcategory: (row.subcategory || row.type || category).trim(),
    brand: (row.brand || 'Generic').trim(),
    price: Math.round((parseFloat(row.price) || 0) * 100) / 100,
    rating: Math.round((parseFloat(row.rating) || 0) * 10) / 10,
    reviews: parseInt(row.review_count || row.reviews || '0', 10) || 0,
    image: (row.image || row.image_url || '').trim() || `/api/img?e=${encodeURIComponent('🛍️')}&h=${hue}&s=${i}`,
  };
}
