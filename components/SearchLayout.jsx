'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FilterIcon, CloseIcon } from './Icons';
import { money } from '@/lib/format';

const SORTS = [['relevance', 'Best match'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['rating', 'Top rated']];

function Section({ title, children }) {
  return <section className="border-b border-line py-5 first:pt-0 last:border-0"><h3 className="mb-3 text-[11px] font-bold uppercase tracking-[.14em] text-muted">{title}</h3>{children}</section>;
}
function Check({ label, count, checked, onChange }) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 py-1 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="grid h-[18px] w-[18px] place-items-center rounded-md border border-line bg-white text-transparent transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
      </span>
      <span className="flex-1 truncate group-hover:text-accent">{label}</span><span className="text-xs text-muted">{count}</span>
    </label>
  );
}

export default function SearchLayout({ qs, params, facets, total, children }) {
  const router = useRouter(), pathname = usePathname();
  const [pending, start] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const sp = useMemo(() => new URLSearchParams(qs), [qs]);
  const [minP, setMinP] = useState(params.filters.minPrice ?? ''), [maxP, setMaxP] = useState(params.filters.maxPrice ?? '');
  useEffect(() => { setMinP(params.filters.minPrice ?? ''); setMaxP(params.filters.maxPrice ?? ''); }, [params.filters.minPrice, params.filters.maxPrice]);
  useEffect(() => { document.body.style.overflow = drawer ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [drawer]);

  const update = (mut) => { const n = new URLSearchParams(sp.toString()); mut(n); n.delete('page'); start(() => router.push(`${pathname}?${n}`, { scroll: false })); };
  const toggleMulti = (key, val) => update((n) => { const cur = n.getAll(key); n.delete(key); (cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val]).forEach((v) => n.append(key, v)); });
  const setOne = (key, val) => update((n) => (val === '' || val == null ? n.delete(key) : n.set(key, val)));
  const applyPrice = () => update((n) => { minP === '' ? n.delete('min') : n.set('min', minP); maxP === '' ? n.delete('max') : n.set('max', maxP); });

  const f = params.filters;
  const active = [
    ...f.categories.map((v) => ({ label: v, off: () => toggleMulti('category', v) })),
    ...f.brands.map((v) => ({ label: v, off: () => toggleMulti('brand', v) })),
    ...(f.minPrice != null || f.maxPrice != null ? [{ label: `${f.minPrice != null ? money(f.minPrice) : 'Any'} to ${f.maxPrice != null ? money(f.maxPrice) : 'Any'}`, off: () => update((n) => { n.delete('min'); n.delete('max'); }) }] : []),
    ...(f.minRating != null ? [{ label: `${f.minRating}★ & up`, off: () => setOne('rating', '') }] : []),
  ];
  const brands = facets ? (showAllBrands ? facets.brands : facets.brands.slice(0, 8)) : [];
  const maxBin = facets ? Math.max(1, ...facets.price.bins) : 1;

  const panel = facets && (
    <div className="text-ink">
      <Section title="Category">{facets.categories.map((c) => <Check key={c.value} label={c.value} count={c.count} checked={f.categories.includes(c.value)} onChange={() => toggleMulti('category', c.value)} />)}</Section>
      <Section title="Brand">
        {brands.map((b) => <Check key={b.value} label={b.value} count={b.count} checked={f.brands.includes(b.value)} onChange={() => toggleMulti('brand', b.value)} />)}
        {facets.brands.length > 8 && <button onClick={() => setShowAllBrands((s) => !s)} className="mt-2 text-xs font-semibold underline-offset-4 hover:underline">{showAllBrands ? 'Show fewer' : `Show all ${facets.brands.length}`}</button>}
      </Section>
      <Section title="Price">
        <div className="mb-3 flex h-10 items-end gap-[3px]" aria-hidden>{facets.price.bins.map((v, i) => <span key={i} className="flex-1 rounded-sm bg-forest/25" style={{ height: `${Math.max(6, (v / maxBin) * 100)}%` }} />)}</div>
        <div className="flex items-center gap-2">
          <input inputMode="numeric" value={minP} onChange={(e) => setMinP(e.target.value)} onBlur={applyPrice} onKeyDown={(e) => e.key === 'Enter' && applyPrice()} placeholder={String(facets.price.min)} aria-label="Minimum price" className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink" />
          <span className="text-muted">to</span>
          <input inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} onBlur={applyPrice} onKeyDown={(e) => e.key === 'Enter' && applyPrice()} placeholder={String(facets.price.max)} aria-label="Maximum price" className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink" />
        </div>
      </Section>
      <Section title="Rating">
        <div className="flex flex-wrap gap-2">
          {[['', 'Any'], ['4', `4★ & up · ${facets.ratings[4]}`], ['3', `3★ & up · ${facets.ratings[3]}`]].map(([v, l]) => (
            <button key={v} onClick={() => setOne('rating', v)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${(f.minRating == null ? '' : String(f.minRating)) === v ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'}`}>{l}</button>
          ))}
        </div>
      </Section>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
      <aside className="hidden lg:block"><div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-card border border-line bg-card p-5 shadow-soft">{panel}</div></aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="pop-in absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-card p-6 shadow-lift">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl">Filters</h2><button onClick={() => setDrawer(false)} aria-label="Close filters"><CloseIcon /></button></div>
            {panel}
            <button onClick={() => setDrawer(false)} className="sticky bottom-0 mt-4 w-full rounded-full bg-ink py-3 text-sm font-semibold text-white">Show {total} results</button>
          </div>
        </div>
      )}
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <button onClick={() => setDrawer(true)} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold lg:hidden"><FilterIcon width={16} height={16} /> Filters{active.length > 0 && ` (${active.length})`}</button>
          <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="Ranking model">
            {[['bm25', 'BM25'], ['tfidf', 'TF-IDF']].map(([v, l]) => (
              <button key={v} onClick={() => setOne('model', v === 'bm25' ? '' : v)} aria-pressed={params.model === v}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${params.model === v ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>
          <label className="ml-auto flex items-center gap-2 text-sm"><span className="hidden text-muted sm:inline">Sort</span>
            <select value={params.sort} onChange={(e) => setOne('sort', e.target.value === 'relevance' ? '' : e.target.value)} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold outline-none focus:border-ink">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
          <button onClick={() => setOne('syn', params.expand ? '0' : '')} aria-pressed={params.expand} className={`rounded-full border px-3 py-1.5 font-semibold transition ${params.expand ? 'border-forest bg-forest-soft text-forest' : 'border-line bg-white text-muted'}`}>Synonyms {params.expand ? 'on' : 'off'}</button>
          <button onClick={() => setOne('scores', params.scores ? '' : '1')} aria-pressed={params.scores} className={`rounded-full border px-3 py-1.5 font-semibold transition ${params.scores ? 'border-forest bg-forest-soft text-forest' : 'border-line bg-white text-muted'}`}>Show scores</button>
          {active.map((a) => <button key={a.label} onClick={a.off} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 font-semibold text-white transition hover:bg-accent">{a.label}<CloseIcon width={12} height={12} /></button>)}
          {active.length > 1 && <button onClick={() => update((n) => { ['category', 'brand', 'min', 'max', 'rating'].forEach((k) => n.delete(k)); })} className="font-semibold text-muted underline-offset-4 hover:underline">Clear all</button>}
        </div>
        <div className={`transition-opacity duration-200 ${pending ? 'pointer-events-none opacity-50' : ''}`} aria-busy={pending}>{children}</div>
      </div>
    </div>
  );
}
