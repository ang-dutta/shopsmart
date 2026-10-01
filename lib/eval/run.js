// Runs every query through each retrieval configuration and aggregates the metrics.
import { search } from '../ir/search.js';
import { precisionAtK, recallAtK, averagePrecision, reciprocalRank, ndcgAtK, mean, pairedTTest } from './metrics.js';

export const SYSTEMS = [
  { key: 'tfidf', label: 'TF-IDF (cosine)', model: 'tfidf', expand: false },
  { key: 'bm25', label: 'BM25', model: 'bm25', expand: false },
  { key: 'tfidf-syn', label: 'TF-IDF + synonyms', model: 'tfidf', expand: true },
  { key: 'bm25-syn', label: 'BM25 + synonyms', model: 'bm25', expand: true },
];

export function runEvaluation(data, queries, ks = [5, 10, 20]) {
  const systems = SYSTEMS.map((sys) => {
    const perQuery = queries.map((q) => {
      // Full pipeline incl. spelling correction; top-100 list is enough for MAP / MRR / nDCG@k.
      const ranked = search(data, { q: q.query, model: sys.model, expand: sys.expand, pageSize: 100, withFacets: false, withSnippets: false }).results.map((r) => r.product.id);
      const row = { id: q.id, query: q.query, kind: q.kind, relevant: Object.values(q.qrels).filter((g) => g > 0).length, P: {}, R: {}, nDCG: {} };
      for (const k of ks) { row.P[k] = precisionAtK(ranked, q.qrels, k); row.R[k] = recallAtK(ranked, q.qrels, k); row.nDCG[k] = ndcgAtK(ranked, q.qrels, k); }
      row.AP = averagePrecision(ranked, q.qrels); row.RR = reciprocalRank(ranked, q.qrels);
      return row;
    });
    const avg = (f) => mean(perQuery.map(f));
    const meanRow = { MAP: avg((r) => r.AP), MRR: avg((r) => r.RR), P: {}, R: {}, nDCG: {} };
    for (const k of ks) { meanRow.P[k] = avg((r) => r.P[k]); meanRow.R[k] = avg((r) => r.R[k]); meanRow.nDCG[k] = avg((r) => r.nDCG[k]); }
    const byKind = {};
    for (const kind of new Set(queries.map((q) => q.kind))) {
      const rows = perQuery.filter((r) => r.kind === kind);
      byKind[kind] = { n: rows.length, MAP: mean(rows.map((r) => r.AP)), MRR: mean(rows.map((r) => r.RR)), nDCG10: mean(rows.map((r) => r.nDCG[10] ?? 0)) };
    }
    return { ...sys, perQuery, mean: meanRow, byKind };
  });
  const by = Object.fromEntries(systems.map((s) => [s.key, s]));
  const test = (a, b, f) => pairedTTest(by[a].perQuery.map(f), by[b].perQuery.map(f));
  return { ks, nQueries: queries.length, systems,
    significance: { metric: 'AP (per-query average precision)', bm25VsTfidf: test('bm25', 'tfidf', (r) => r.AP), bm25SynVsBm25: test('bm25-syn', 'bm25', (r) => r.AP) } };
}
