// URL query-string -> typed search options (shared by the search page and /api/search).
export function parseSearchParams(sp) {
  const all = (k) => (sp instanceof URLSearchParams ? sp.getAll(k) : [].concat(sp?.[k] ?? []));
  const one = (k) => all(k)[0];
  const num = (k) => { const v = parseFloat(one(k)); return Number.isFinite(v) ? v : null; };
  return {
    q: one('q') ?? '',
    model: one('model') === 'tfidf' ? 'tfidf' : 'bm25',
    sort: ['price_asc', 'price_desc', 'rating'].includes(one('sort')) ? one('sort') : 'relevance',
    page: Math.max(1, parseInt(one('page') || '1', 10) || 1),
    expand: one('syn') !== '0',
    exact: one('exact') === '1',
    scores: one('scores') === '1',
    filters: { categories: all('category'), brands: all('brand'), minPrice: num('min'), maxPrice: num('max'), minRating: num('rating') },
  };
}
