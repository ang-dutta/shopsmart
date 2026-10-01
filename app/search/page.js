import Link from 'next/link';
import { getData } from '@/lib/data';
import { search } from '@/lib/ir/search';
import { correctQuery } from '@/lib/ir/spell';
import { parseSearchParams } from '@/lib/params';
import SearchLayout from '@/components/SearchLayout';
import ProductGrid from '@/components/ProductGrid';
import Pagination from '@/components/Pagination';
import { categoryStyle } from '@/lib/format';

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  return { title: sp.q ? `“${[].concat(sp.q)[0]}”` : 'Browse all products' };
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams, p = parseSearchParams(sp), data = getData();
  const res = search(data, { q: p.q, model: p.model, expand: p.expand, exact: p.exact, filters: p.filters, sort: p.sort, page: p.page, pageSize: 24 });
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) [].concat(v).forEach((x) => qs.append(k, x));
  const withExact = (v) => { const n = new URLSearchParams(qs); v ? n.set('exact', '1') : n.delete('exact'); return `/search?${n}`; };
  const swapQuery = (q) => { const n = new URLSearchParams(qs); n.set('q', q); n.delete('exact'); n.delete('page'); return `/search?${n}`; };
  // "Did you mean" is shown when the user forced their exact spelling, or when nothing at all matched.
  const didYouMean = (p.exact || res.total === 0) && p.q ? correctQuery(p.q, data.lexicon) : null;

  return (
    <div className="py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          {p.q ? <>Results for <span className="italic text-accent">“{res.query.corrected ? res.query.used : p.q}”</span></> : 'Browse everything'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          <b className="text-ink">{res.total.toLocaleString()}</b> products · {res.tookMs} ms · ranked by <b className="text-ink">{p.model === 'bm25' ? 'BM25' : 'TF-IDF cosine'}</b>
          {p.q && res.query.expansions.length > 0 && <> · also matching {res.query.expansions.slice(0, 4).map((e) => e.to).join(', ')}</>}
        </p>
        {res.query.corrected && <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 rounded-2xl bg-accent-soft px-4 py-2 text-sm">Showing results for <b>{res.query.used}</b>. <Link href={withExact(true)} className="font-semibold underline underline-offset-4">Search instead for “{p.q}”</Link></p>}
        {didYouMean?.changed && !res.query.corrected && <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 rounded-2xl bg-accent-soft px-4 py-2 text-sm">Did you mean <Link href={swapQuery(didYouMean.text)} className="font-bold underline underline-offset-4">{didYouMean.text}</Link>?</p>}
      </div>

      <SearchLayout qs={qs.toString()} params={p} facets={res.facets} total={res.total}>
        {res.total === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-white/60 p-10 text-center">
            <p className="font-display text-3xl">Nothing matched yet.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">Try fewer words, check the spelling, or clear a filter. Or start from a category:</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">{Object.keys(data.meta.categories).map((c) => <Link key={c} href={`/search?category=${encodeURIComponent(c)}`} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink">{categoryStyle(c)[0]} {c}</Link>)}</div>
          </div>
        ) : (
          <>
            <ProductGrid items={res.results} showScores={p.scores} className="xl:grid-cols-3" />
            <Pagination page={res.page} pages={res.pages} qs={qs.toString()} />
          </>
        )}
      </SearchLayout>
    </div>
  );
}
