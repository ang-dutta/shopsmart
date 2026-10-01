// Query parsing, ranking (TF-IDF cosine / BM25), filtering, faceting, sorting and result formatting.
import { words, stemWord, STOPWORDS } from './text.js';
import { synonymsOf } from './synonyms.js';
import { correctQuery, prefixWords } from './spell.js';
import { tfidfIdf, bm25Idf, K1, B } from './indexer.js';
import { segments, makeSnippet } from './snippet.js';

const SYN_WEIGHT = 0.4;
const popcount = (x) => { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };
const post = (index, stem) => (Object.hasOwn(index.terms, stem) ? index.terms[stem] : null);

/** text -> {terms:[{stem,w,group}], minGroups, used, corrected, expansions} */
export function parseQuery(data, q, { expand = true, correct = true, prefix = false } = {}) {
  const original = String(q ?? '').slice(0, 200).trim();
  let used = original, corrected = false;
  if (correct && original) { const c = correctQuery(original, data.lexicon); if (c.changed) { used = c.text; corrected = true; } }
  const raw = words(used).filter((w) => !STOPWORDS.has(w)).slice(0, 12);
  const terms = [], seen = new Map(), expansions = [];
  const add = (stem, w, group) => {
    if (seen.has(stem)) { const t = seen.get(stem); if (w > t.w) t.w = w; return false; }
    const t = { stem, w, group }; seen.set(stem, t); terms.push(t); return true;
  };
  raw.forEach((w, g) => {
    add(stemWord(w), 1, g);
    if (expand) for (const s of synonymsOf(w)) { const st = stemWord(s); if (post(data.index, st) && add(st, SYN_WEIGHT, g)) expansions.push({ from: w, to: s }); }
    if (prefix && g === raw.length - 1) for (const c of prefixWords(data.lexicon, w)) add(stemWord(c), 0.6, g);
  });
  // "minimum should match": queries with 3+ terms must match at least half of them (identical for every model)
  return { original, used, corrected, terms, expansions, minGroups: raw.length <= 2 ? 1 : Math.ceil(raw.length / 2), nWords: raw.length };
}

/** Scores every document that shares a term with the query. Returns dense score + matched-group bitmask arrays. */
export function scoreDocs(index, terms, model) {
  const { N, docLen, avgdl, norm } = index;
  const scores = new Float64Array(N), mask = new Int32Array(N);
  let qnorm = 0;
  for (const { stem, w, group } of terms) {
    const a = post(index, stem);
    if (!a) continue;
    const df = a.length >> 1;
    if (model === 'bm25') {
      const idf = bm25Idf(N, df) * w;
      for (let i = 0; i < a.length; i += 2) {
        const d = a[i], tf = a[i + 1];
        scores[d] += (idf * tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * docLen[d]) / avgdl));
        mask[d] |= 1 << group;
      }
    } else {
      const idf = tfidfIdf(N, df), qw = w * idf;
      qnorm += qw * qw;
      for (let i = 0; i < a.length; i += 2) { scores[a[i]] += qw * (1 + Math.log(a[i + 1])) * idf; mask[a[i]] |= 1 << group; }
    }
  }
  if (model !== 'bm25') { const qn = Math.sqrt(qnorm) || 1; for (let d = 0; d < N; d++) if (scores[d] > 0) scores[d] /= qn * norm[d]; }
  return { scores, mask };
}

const SORTS = {
  price_asc: (p, a, b) => p[a].price - p[b].price,
  price_desc: (p, a, b) => p[b].price - p[a].price,
  rating: (p, a, b) => p[b].rating - p[a].rating || p[b].reviews - p[a].reviews,
};

export function search(data, opts = {}) {
  const t0 = performance.now();
  const { q = '', model = 'bm25', expand = true, correct = true, exact = false, prefix = false, filters = {}, sort = 'relevance',
    page = 1, pageSize = 24, withFacets = true, withSnippets = true } = opts;
  const { products, index, popularity } = data, N = index.N;
  const pq = parseQuery(data, q, { expand, correct: correct && !exact, prefix });

  // ---- 1. candidate retrieval + ranking ----
  let cand = [], scores = null;
  if (pq.terms.length) {
    const r = scoreDocs(index, pq.terms, model);
    scores = r.scores;
    for (let d = 0; d < N; d++) if (scores[d] > 0 && popcount(r.mask[d]) >= pq.minGroups) cand.push(d);
  } else if (!String(q).trim()) cand = Array.from({ length: N }, (_, i) => i); // browse mode (no query)

  // ---- 2. filters + facet counts (each facet ignores its own filter, like real e-commerce sites) ----
  const cats = filters.categories ?? [], brands = filters.brands ?? [];
  const { minPrice = null, maxPrice = null, minRating = null } = filters;
  const facets = { categories: new Map(), brands: new Map(), ratings: { 4: 0, 3: 0 }, price: { min: Infinity, max: 0, values: [] } };
  const hits = [];
  for (const d of cand) {
    const p = products[d];
    const okC = !cats.length || cats.includes(p.category), okB = !brands.length || brands.includes(p.brand);
    const okP = (minPrice == null || p.price >= minPrice) && (maxPrice == null || p.price <= maxPrice);
    const okR = minRating == null || p.rating >= minRating;
    if (withFacets) {
      if (okB && okP && okR) facets.categories.set(p.category, (facets.categories.get(p.category) || 0) + 1);
      if (okC && okP && okR) facets.brands.set(p.brand, (facets.brands.get(p.brand) || 0) + 1);
      if (okC && okB && okR) { facets.price.values.push(p.price); facets.price.min = Math.min(facets.price.min, p.price); facets.price.max = Math.max(facets.price.max, p.price); }
      if (okC && okB && okP) { if (p.rating >= 4) facets.ratings[4]++; if (p.rating >= 3) facets.ratings[3]++; }
    }
    if (okC && okB && okP && okR) hits.push(d);
  }

  // ---- 3. sorting ----
  if (sort in SORTS) hits.sort((a, b) => SORTS[sort](products, a, b) || popularity[b] - popularity[a]);
  else if (scores) hits.sort((a, b) => scores[b] - scores[a] || popularity[b] - popularity[a]);
  else hits.sort((a, b) => popularity[b] - popularity[a]);

  // ---- 4. paginate + decorate (highlighted title / snippet) ----
  const pages = Math.max(1, Math.ceil(hits.length / pageSize)), cur = Math.min(Math.max(1, page), pages);
  const stemSet = new Set(pq.terms.map((t) => t.stem));
  const results = hits.slice((cur - 1) * pageSize, cur * pageSize).map((d) => {
    const p = products[d];
    return { product: p, score: scores ? +scores[d].toFixed(4) : 0,
      titleSegs: stemSet.size ? segments(p.title, stemSet) : [{ t: p.title }],
      snippetSegs: withSnippets ? (stemSet.size ? makeSnippet(p.description, stemSet) : [{ t: p.description.slice(0, 150) + '…' }]) : null };
  });

  let facetOut = null;
  if (withFacets) {
    const { min, max, values } = facets.price, bins = new Array(12).fill(0);
    if (values.length) for (const v of values) bins[Math.min(11, Math.floor(((v - min) / (max - min || 1)) * 12))]++;
    const list = (m, sel) => { const a = [...m].map(([value, count]) => ({ value, count })).sort((x, y) => y.count - x.count); for (const s of sel) if (!m.has(s)) a.push({ value: s, count: 0 }); return a; };
    facetOut = { categories: list(facets.categories, cats), brands: list(facets.brands, brands).slice(0, 40), ratings: facets.ratings, price: { min: values.length ? Math.floor(min) : 0, max: values.length ? Math.ceil(max) : 0, bins } };
  }
  return { query: { original: pq.original, used: pq.used, corrected: pq.corrected, expansions: pq.expansions, terms: pq.terms.map((t) => t.stem) },
    model, total: hits.length, page: cur, pages, results, facets: facetOut, tookMs: +(performance.now() - t0).toFixed(1) };
}
