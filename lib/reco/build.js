// Offline builders for the recommender artefacts (run by scripts/build-index.mjs).
import { tfidfIdf } from '../ir/indexer.js';

/** Content-based: top-k TF-IDF cosine neighbours for every product, using the inverted index. */
export function buildSimilar(index, k = 12) {
  const { N, norm, terms } = index;
  const docTerms = Array.from({ length: N }, () => []);
  for (const [t, a] of Object.entries(terms)) {
    const idf = tfidfIdf(N, a.length / 2);
    for (let i = 0; i < a.length; i += 2) docTerms[a[i]].push([t, (1 + Math.log(a[i + 1])) * idf]);
  }
  const acc = new Float64Array(N), out = new Array(N);
  for (let a = 0; a < N; a++) {
    const touched = [];
    for (const [t, wa] of docTerms[a]) {
      const post = terms[t], idf = tfidfIdf(N, post.length / 2);
      for (let i = 0; i < post.length; i += 2) {
        const d = post[i];
        if (acc[d] === 0) touched.push(d);
        acc[d] += wa * (1 + Math.log(post[i + 1])) * idf;
      }
    }
    const top = [];
    for (const d of touched) { const s = acc[d] / (norm[a] * norm[d]); acc[d] = 0; if (d !== a && s > 0.05) top.push([d, s]); }
    top.sort((x, y) => y[1] - x[1]);
    out[a] = top.slice(0, k).flatMap(([d, s]) => [d, +s.toFixed(3)]);
  }
  return out;
}

const EVENT_WEIGHT = { view: 1, add_to_cart: 3, purchase: 5 };

/**
 * Collaborative "customers also bought": item-item cosine similarity over the implicit-feedback user×item matrix
 * (view=1, add-to-cart=3, purchase=5).  Pairs from the SAME sub-category are skipped on purpose - alternatives
 * belong in "Similar products"; "also bought" should surface complementary items.
 */
export function buildAlsoBought(events, idToPos, subOf, N, k = 12) {
  const users = new Map();
  for (const e of events) {
    const pos = idToPos.get(e.product_id), w = EVENT_WEIGHT[e.event];
    if (pos === undefined || !w) continue;
    if (!users.has(e.user_id)) users.set(e.user_id, new Map());
    const m = users.get(e.user_id);
    m.set(pos, Math.max(m.get(pos) || 0, w));
  }
  const sq = new Float64Array(N), co = new Map(), popularity = new Float64Array(N);
  for (const items of users.values()) {
    const arr = [...items];
    for (const [i, w] of arr) { sq[i] += w * w; popularity[i] += w; }
    for (let x = 0; x < arr.length; x++) for (let y = x + 1; y < arr.length; y++) {
      const [i, wi] = arr[x], [j, wj] = arr[y];
      if (subOf[i] === subOf[j]) continue;
      co.set(i * N + j, (co.get(i * N + j) || 0) + wi * wj);
      co.set(j * N + i, (co.get(j * N + i) || 0) + wi * wj);
    }
  }
  const lists = Array.from({ length: N }, () => []);
  for (const [key, v] of co) { const i = Math.floor(key / N), j = key % N; lists[i].push([j, v / Math.sqrt(sq[i] * sq[j])]); }
  const out = lists.map((l) => l.sort((a, b) => b[1] - a[1]).slice(0, k).flatMap(([d, s]) => [d, +s.toFixed(3)]));
  return { alsoBought: out, popularity: Array.from(popularity) };
}
