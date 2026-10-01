// Standard ranked-retrieval metrics.  `ranked` = array of doc ids (best first); `qrels` = {docId: gradedRelevance}.
// Binary metrics (P, R, AP, RR) treat grade >= 1 as relevant; nDCG uses the graded gains (2^g - 1).
const isRel = (qrels, id) => (qrels[id] ?? 0) > 0;
export const totalRelevant = (qrels) => Object.values(qrels).filter((g) => g > 0).length;

export function precisionAtK(ranked, qrels, k) {
  let hits = 0;
  for (let i = 0; i < k && i < ranked.length; i++) if (isRel(qrels, ranked[i])) hits++;
  return hits / k;
}
export function recallAtK(ranked, qrels, k) {
  const R = totalRelevant(qrels);
  if (!R) return 0;
  let hits = 0;
  for (let i = 0; i < k && i < ranked.length; i++) if (isRel(qrels, ranked[i])) hits++;
  return hits / R;
}
/** Average precision: mean of P@i over the ranks i where a relevant doc appears, divided by total #relevant. */
export function averagePrecision(ranked, qrels) {
  const R = totalRelevant(qrels);
  if (!R) return 0;
  let hits = 0, sum = 0;
  ranked.forEach((id, i) => { if (isRel(qrels, id)) { hits++; sum += hits / (i + 1); } });
  return sum / R;
}
export function reciprocalRank(ranked, qrels) {
  const i = ranked.findIndex((id) => isRel(qrels, id));
  return i < 0 ? 0 : 1 / (i + 1);
}
export function ndcgAtK(ranked, qrels, k) {
  const gain = (g) => 2 ** g - 1, disc = (i) => Math.log2(i + 2);
  let dcg = 0;
  for (let i = 0; i < k && i < ranked.length; i++) dcg += gain(qrels[ranked[i]] ?? 0) / disc(i);
  const ideal = Object.values(qrels).sort((a, b) => b - a).slice(0, k);
  const idcg = ideal.reduce((s, g, i) => s + gain(g) / disc(i), 0);
  return idcg ? dcg / idcg : 0;
}

export const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
/** Paired t-test on per-query differences (normal approximation of the p-value; fine for n >= 30). */
export function pairedTTest(a, b) {
  const d = a.map((x, i) => x - b[i]), n = d.length, m = mean(d);
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)) || 1e-12;
  const t = m / (sd / Math.sqrt(n));
  return { meanDiff: m, t, p: 2 * (1 - 0.5 * (1 + erf(Math.abs(t) / Math.SQRT2))), n };
}
