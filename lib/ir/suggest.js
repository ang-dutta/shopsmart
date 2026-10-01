// Autocomplete: phrase-prefix matching over the pre-built phrase list + "search-as-you-type" product hits.
import { normalize } from './text.js';
import { correctQuery } from './spell.js';
import { search } from './search.js';

const TYPE = ['phrase', 'category', 'type', 'brand'];

export function suggest(data, q, { limit = 6, productLimit = 4 } = {}) {
  const query = normalize(q).trim().replace(/\s+/g, ' ');
  if (!query) {
    const trending = data.suggest.filter((s) => s[2] === 2).slice(0, 8).map((s) => ({ text: s[0], type: 'type' }));
    return { query, suggestions: trending, products: [], trending: true };
  }
  const toks = query.split(' '), last = toks[toks.length - 1], head = toks.slice(0, -1);
  const scored = [];
  for (const [phrase, score, t] of data.suggest) {
    let rank = 0;
    if (phrase.startsWith(query)) rank = 2e6;
    else {
      const w = phrase.split(/[\s-]+/);
      if (head.every((h) => w.includes(h)) && w.some((x) => x.startsWith(last))) rank = 1e6;
    }
    if (rank) scored.push({ text: phrase, type: TYPE[t], rank: rank + score });
  }
  const suggestions = scored.sort((a, b) => b.rank - a.rank).slice(0, limit).map(({ text, type }) => ({ text, type }));
  const products = search(data, { q: query, prefix: true, expand: false, correct: false, pageSize: productLimit, withFacets: false, withSnippets: false })
    .results.map((r) => r.product);
  let correction = null;
  if (!suggestions.length && !products.length) { const c = correctQuery(query, data.lexicon); if (c.changed) correction = c.text; }
  return { query, suggestions, products, correction };
}
