// Inverted-index construction + the two term-weighting formulas.
import { analyze, words, STOPWORDS } from './text.js';

export const K1 = 1.2, B = 0.75;
export const tfidfIdf = (N, df) => Math.log(1 + N / df);                       // smoothed idf, always > 0
export const bm25Idf = (N, df) => Math.log(1 + (N - df + 0.5) / (df + 0.5));   // Robertson-Sparck Jones (Lucene form)

/** Field weighting by repetition: title x3, brand x2, category/sub-category x2, description x1. */
export function docTokens(p) {
  const t = analyze(p.title), b = analyze(p.brand), c = analyze(`${p.category} ${p.subcategory}`), d = analyze(p.description);
  return [...t, ...t, ...t, ...b, ...b, ...c, ...c, ...d];
}

/**
 * Builds the inverted index:  stem -> [docPos, tf, docPos, tf, ...]  (flat array, postings sorted by docPos)
 * plus document lengths and pre-computed TF-IDF vector norms (needed for cosine similarity).
 */
export function buildIndex(products) {
  const N = products.length, postings = new Map(), docLen = new Array(N);
  products.forEach((p, d) => {
    const toks = docTokens(p), tf = new Map();
    docLen[d] = toks.length;
    for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
    for (const [t, f] of tf) { let a = postings.get(t); if (!a) postings.set(t, (a = [])); a.push(d, f); }
  });
  const avgdl = docLen.reduce((a, b) => a + b, 0) / N;
  const sq = new Float64Array(N);
  for (const a of postings.values()) {
    const idf = tfidfIdf(N, a.length / 2);
    for (let i = 0; i < a.length; i += 2) sq[a[i]] += ((1 + Math.log(a[i + 1])) * idf) ** 2;
  }
  return { N, avgdl: +avgdl.toFixed(3), K1, B, docLen, norm: Array.from(sq, (x) => +Math.sqrt(x).toFixed(5)), terms: Object.fromEntries(postings) };
}

/** Spell-check vocabulary: raw (unstemmed) word -> document frequency. */
export function buildLexicon(products) {
  const df = new Map();
  for (const p of products) {
    const seen = new Set(words(`${p.title} ${p.brand} ${p.category} ${p.subcategory} ${p.description}`));
    for (const w of seen) if (/^[a-z]{3,}$/.test(w) && !STOPWORDS.has(w)) df.set(w, (df.get(w) || 0) + 1);
  }
  return Object.fromEntries(df);
}

/** Autocomplete phrases: categories, sub-categories, brands and frequent title n-grams. [phrase, score, typeCode] */
export function buildSuggestions(products, popularity) {
  const map = new Map();
  const put = (p, s, t) => { const k = p.toLowerCase(); const o = map.get(k); if (!o || s > o[1]) map.set(k, [k, s, t]); };
  const count = (key, t) => { const m = new Map(); products.forEach((p, i) => m.set(p[key], (m.get(p[key]) || 0) + 1 + popularity[i] * 0.01)); for (const [k, v] of m) put(k, Math.round(v * 10) / 10, t); };
  count('category', 1); count('subcategory', 2); count('brand', 3);
  const ng = new Map();
  for (const p of products) {
    const w = p.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f'’]/g, '').split(/[^a-z0-9]+/).filter(Boolean), seen = new Set();
    for (let n = 2; n <= 3; n++) for (let i = 0; i + n <= w.length; i++) {
      const g = w.slice(i, i + n);
      if (g.some((x) => x.length < 2 || /^\d+$/.test(x)) || STOPWORDS.has(g[0]) || STOPWORDS.has(g[n - 1])) continue;
      seen.add(g.join(' '));
    }
    for (const s of seen) ng.set(s, (ng.get(s) || 0) + 1);
  }
  for (const [g, c] of ng) if (c >= 8) put(g, c, 0);
  return [...map.values()].sort((a, b) => b[1] - a[1]).slice(0, 6000);
}
