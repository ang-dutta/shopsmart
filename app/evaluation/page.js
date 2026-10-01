import Link from 'next/link';
import { getEvaluation } from '@/lib/eval/cache';

const pct = (x) => x.toFixed(3);
const COLORS = { tfidf: '#6e6a5e', bm25: '#e2492b', 'tfidf-syn': '#b9b3a2', 'bm25-syn': '#1d3b2e' };

function Bars({ ev, k }) {
  const metrics = [[`P@${k}`, (s) => s.mean.P[k]], [`R@${k}`, (s) => s.mean.R[k]], [`nDCG@${k}`, (s) => s.mean.nDCG[k]], ['MAP', (s) => s.mean.MAP], ['MRR', (s) => s.mean.MRR]];
  return (
    <div className="grid grid-cols-5 gap-3 sm:gap-6" role="img" aria-label="Metric comparison bar chart">
      {metrics.map(([name, f]) => (
        <div key={name} className="flex flex-col items-center">
          <div className="flex h-48 w-full items-end justify-center gap-1 border-b border-line sm:gap-1.5">
            {ev.systems.map((s) => (
              <div key={s.key} className="group relative flex h-full flex-1 items-end">
                <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${Math.max(2, f(s) * 100)}%`, background: COLORS[s.key] }} />
                <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] text-white opacity-0 group-hover:opacity-100">{pct(f(s))}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs font-bold">{name}</div>
        </div>
      ))}
    </div>
  );
}

export default async function EvaluationPage({ searchParams }) {
  const sp = await searchParams, ev = getEvaluation();
  if (!ev) return <div className="py-20 text-center"><h1 className="font-display text-4xl">No evaluation queries found</h1><p className="mt-3 text-muted">Add <code>data/eval/queries.json</code> (see the README) or run <code>npm run data:generate -- --force</code>.</p></div>;
  const k = ev.ks.includes(Number(sp.k)) ? Number(sp.k) : 10;
  const [tfidf, bm25] = ev.systems, sig = ev.significance.bm25VsTfidf, sig2 = ev.significance.bm25SynVsBm25;
  const best = [...ev.systems].sort((a, b) => b.mean.MAP - a.mean.MAP)[0];
  const kinds = Object.keys(tfidf.byKind);
  const cell = 'px-3 py-2.5 text-right font-mono text-[13px] tabular-nums';
  const th = 'px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-[.12em] text-muted';

  return (
    <div className="py-8 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-forest">Offline evaluation</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">TF-IDF <span className="italic text-muted">vs</span> BM25, measured.</h1>
      <p className="mt-4 max-w-2xl text-muted">{ev.nQueries} test queries with graded relevance judgments (2 = exactly what was asked, 1 = right product type but not every attribute). Every query runs through the full pipeline - spelling correction included - and the top 100 results are scored.</p>

      <div className="mt-6 flex items-center gap-2 text-sm"><span className="text-muted">Cut-off k</span>
        {ev.ks.map((n) => <Link key={n} href={`/evaluation?k=${n}`} className={`rounded-full border px-4 py-1.5 font-semibold transition ${n === k ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'}`}>{n}</Link>)}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-card border border-line bg-white p-6 shadow-soft"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Best MAP</p><p className="mt-2 font-display text-4xl">{best.label}</p><p className="font-mono text-sm text-muted">MAP {pct(best.mean.MAP)}</p></div>
        <div className="rounded-card border border-line bg-white p-6 shadow-soft"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">BM25 − TF-IDF (AP)</p><p className={`mt-2 font-display text-4xl ${sig.meanDiff >= 0 ? 'text-forest' : 'text-accent'}`}>{sig.meanDiff >= 0 ? '+' : ''}{sig.meanDiff.toFixed(4)}</p><p className="font-mono text-sm text-muted">paired t = {sig.t.toFixed(2)}, p ≈ {sig.p.toFixed(3)} {sig.p < 0.05 ? '(significant)' : '(not significant)'}</p></div>
        <div className="rounded-card border border-line bg-white p-6 shadow-soft"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Synonyms (BM25, AP)</p><p className={`mt-2 font-display text-4xl ${sig2.meanDiff >= 0 ? 'text-forest' : 'text-accent'}`}>{sig2.meanDiff >= 0 ? '+' : ''}{sig2.meanDiff.toFixed(4)}</p><p className="font-mono text-sm text-muted">paired t = {sig2.t.toFixed(2)}, p ≈ {sig2.p.toFixed(3)}</p></div>
      </div>

      <section className="mt-10 rounded-card border border-line bg-white p-6 shadow-soft sm:p-8">
        <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">{ev.systems.map((s) => <span key={s.key} className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-sm" style={{ background: COLORS[s.key] }} />{s.label}</span>)}</div>
        <Bars ev={ev} k={k} />
      </section>

      <section className="mt-10 overflow-x-auto rounded-card border border-line bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-line"><th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[.12em] text-muted">System</th>{[`P@${k}`, `R@${k}`, `nDCG@${k}`, 'MAP', 'MRR'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>{ev.systems.map((s) => {
            const vals = [s.mean.P[k], s.mean.R[k], s.mean.nDCG[k], s.mean.MAP, s.mean.MRR];
            return <tr key={s.key} className="border-b border-line/60 last:border-0"><td className="px-3 py-2.5 font-semibold"><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[s.key] }} />{s.label}</td>
              {vals.map((v, i) => { const top = Math.max(...ev.systems.map((x) => [x.mean.P[k], x.mean.R[k], x.mean.nDCG[k], x.mean.MAP, x.mean.MRR][i])); return <td key={i} className={`${cell} ${v === top ? 'font-bold text-forest' : ''}`}>{pct(v)}</td>; })}</tr>;
          })}</tbody>
        </table>
      </section>

      <h2 className="mt-14 font-display text-3xl">By query type</h2>
      <p className="mt-1 text-sm text-muted">MAP per family of queries - synonym expansion should help most where the query word never appears in the product text.</p>
      <section className="mt-4 overflow-x-auto rounded-card border border-line bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-line"><th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[.12em] text-muted">Query type</th><th className={th}>#</th>{ev.systems.map((s) => <th key={s.key} className={th}>{s.label}</th>)}</tr></thead>
          <tbody>{kinds.map((kd) => (
            <tr key={kd} className="border-b border-line/60 last:border-0"><td className="px-3 py-2.5 font-semibold capitalize">{kd}</td><td className={cell}>{tfidf.byKind[kd].n}</td>
              {ev.systems.map((s) => { const top = Math.max(...ev.systems.map((x) => x.byKind[kd].MAP)); return <td key={s.key} className={`${cell} ${s.byKind[kd].MAP === top ? 'font-bold text-forest' : ''}`}>{pct(s.byKind[kd].MAP)}</td>; })}</tr>
          ))}</tbody>
        </table>
      </section>

      <h2 className="mt-14 font-display text-3xl">Per-query results</h2>
      <p className="mt-1 text-sm text-muted">Average precision and nDCG@{k} for the two base models. Green = BM25 better, red = TF-IDF better.</p>
      <section className="mt-4 overflow-x-auto rounded-card border border-line bg-white shadow-soft">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-line"><th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[.12em] text-muted">Query</th><th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[.12em] text-muted">Type</th><th className={th}>#rel</th><th className={th}>AP TF-IDF</th><th className={th}>AP BM25</th><th className={th}>Δ</th><th className={th}>nDCG TF-IDF</th><th className={th}>nDCG BM25</th></tr></thead>
          <tbody>{tfidf.perQuery.map((r, i) => {
            const b = bm25.perQuery[i], d = b.AP - r.AP;
            return <tr key={r.id} className="border-b border-line/60 last:border-0"><td className="px-3 py-2.5 font-semibold">{r.query}</td><td className="px-3 py-2.5 capitalize text-muted">{r.kind}</td><td className={cell}>{r.relevant}</td><td className={cell}>{pct(r.AP)}</td><td className={cell}>{pct(b.AP)}</td>
              <td className={`${cell} ${Math.abs(d) < 5e-4 ? 'text-muted' : d > 0 ? 'text-forest' : 'text-accent'}`}>{d > 0 ? '+' : ''}{d.toFixed(3)}</td><td className={cell}>{pct(r.nDCG[k])}</td><td className={cell}>{pct(b.nDCG[k])}</td></tr>;
          })}</tbody>
        </table>
      </section>

      <div className="mt-10 rounded-card bg-forest-soft p-6 text-sm leading-relaxed text-forest">
        <p className="font-bold">How to read this honestly</p>
        <p className="mt-1">The catalogue is synthetic, so judgments come from the generator’s hidden ground truth (product type, attributes, brand) rather than from indexed text. The corpus is short and templated, so TF-IDF and BM25 land close together - the more interesting gaps are between query types and with synonym expansion. On a real catalogue with long, noisy descriptions, BM25’s length normalisation and term-frequency saturation usually open a wider gap. See the README for how to plug in your own judgments.</p>
      </div>
    </div>
  );
}
