// Runtime recommenders: content-based (similar), collaborative (also bought), hybrid personalised (for you), trending.
import { docTokens, tfidfIdf } from '../ir/indexer.js';
import { scoreDocs } from '../ir/search.js';

const pairs = (flat = []) => { const o = []; for (let i = 0; i < flat.length; i += 2) o.push([flat[i], flat[i + 1]]); return o; };
const card = (data, pos, extra = {}) => ({ product: data.products[pos], ...extra });

/** Content-based: nearest neighbours by TF-IDF cosine similarity (pre-computed offline). */
export function similarTo(data, id, k = 8) {
  const pos = data.idToPos.get(id);
  return pos === undefined ? [] : pairs(data.similar[pos]).slice(0, k).map(([d, s]) => card(data, d, { score: s, badge: `${Math.round(s * 100)}% match` }));
}

/** Collaborative: item-item cosine on interactions; topped up with popular items from the same category if sparse. */
export function alsoBoughtFor(data, id, k = 8) {
  const pos = data.idToPos.get(id);
  if (pos === undefined) return [];
  const out = pairs(data.alsoBought[pos]).slice(0, k).map(([d, s]) => card(data, d, { score: s, badge: 'Bought together' }));
  if (out.length < Math.min(k, 4)) {
    const me = data.products[pos], have = new Set(out.map((o) => o.product.id));
    for (const d of data.byPopularity) {
      const p = data.products[d];
      if (p.category === me.category && p.subcategory !== me.subcategory && !have.has(p.id)) { out.push(card(data, d, { score: 0, badge: 'Popular pick' })); have.add(p.id); }
      if (out.length >= k) break;
    }
  }
  return out;
}

export function trending(data, { k = 8, category = null } = {}) {
  const out = [];
  for (const d of data.byPopularity) { if (!category || data.products[d].category === category) out.push(card(data, d, { badge: 'Trending' })); if (out.length >= k) break; }
  return out;
}

/**
 * "Recommended for you": hybrid of
 *   content  - a user profile vector (recency-decayed sum of the viewed products' TF-IDF vectors) scored against the
 *              inverted index by cosine similarity, and
 *   collab   - the "also bought" neighbours of the viewed / carted products.
 * hybrid = 0.65 * content + 0.35 * collab (each max-normalised); already-seen items are removed and results
 * are diversified (max 3 per sub-category first).
 */
export function forYou(data, viewedIds, cartIds = [], k = 12) {
  const { index, products, idToPos } = data, N = index.N;
  const seen = [...new Set([...viewedIds])].map((id) => idToPos.get(id)).filter((p) => p !== undefined).slice(0, 20);
  const carted = cartIds.map((id) => idToPos.get(id)).filter((p) => p !== undefined);
  if (!seen.length && !carted.length) return { personalised: false, items: trending(data, { k }) };

  const profile = new Map(), collab = new Float64Array(N);
  [...seen.map((p, i) => [p, 0.85 ** i]), ...carted.map((p) => [p, 1.5])].forEach(([pos, decay]) => {
    const tf = new Map();
    for (const t of docTokens(products[pos])) tf.set(t, (tf.get(t) || 0) + 1);
    for (const [t, f] of tf) {
      const a = Object.hasOwn(index.terms, t) ? index.terms[t] : null;
      if (a) profile.set(t, (profile.get(t) || 0) + (decay * (1 + Math.log(f)) * tfidfIdf(N, a.length / 2)) / index.norm[pos]);
    }
    for (const [d, s] of pairs(data.alsoBought[pos])) collab[d] += decay * s;
  });
  const terms = [...profile].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([stem, w]) => ({ stem, w, group: 0 }));
  const { scores } = scoreDocs(index, terms, 'tfidf');
  let mc = 1e-9, mb = 1e-9;
  for (let d = 0; d < N; d++) { if (scores[d] > mc) mc = scores[d]; if (collab[d] > mb) mb = collab[d]; }
  const exclude = new Set([...seen, ...carted]), ranked = [];
  for (let d = 0; d < N; d++) {
    if (exclude.has(d) || (scores[d] === 0 && collab[d] === 0)) continue;
    const c = scores[d] / mc, b = collab[d] / mb;
    ranked.push({ d, s: 0.65 * c + 0.35 * b, reason: b > c ? 'Often bought with items you viewed' : 'Similar to items you viewed' });
  }
  ranked.sort((a, b) => b.s - a.s);
  const per = {}, picked = [], rest = [];
  for (const r of ranked) {
    const sub = products[r.d].subcategory;
    if ((per[sub] = (per[sub] || 0) + 1) <= 3) picked.push(r); else rest.push(r);
    if (picked.length >= k) break;
  }
  const items = [...picked, ...rest].slice(0, k).map((r) => card(data, r.d, { score: +r.s.toFixed(3), badge: r.reason }));
  return { personalised: true, items };
}
