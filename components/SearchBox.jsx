'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductImage from './ProductImage';
import { SearchIcon, ClockIcon, TrendIcon, SparkIcon, CloseIcon } from './Icons';
import { getRecent, pushRecent, clearRecent } from '@/lib/client-store';
import { money } from '@/lib/format';

const ICON = { recent: ClockIcon, type: TrendIcon, 'did-you-mean': SparkIcon };

export default function SearchBox({ variant = 'compact', initial = '', autoFocus = false }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ suggestions: [], products: [] });
  const [recent, setRecent] = useState([]);
  const [active, setActive] = useState(-1);
  const box = useRef(null), timer = useRef(null), ctrl = useRef(null);

  useEffect(() => setQ(initial), [initial]);
  useEffect(() => {
    const h = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => {
    if (!open) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      ctrl.current?.abort(); ctrl.current = new AbortController();
      try { const r = await fetch('/api/suggest?q=' + encodeURIComponent(q), { signal: ctrl.current.signal }); setData(await r.json()); setActive(-1); } catch {}
    }, q ? 110 : 0);
    return () => clearTimeout(timer.current);
  }, [q, open]);

  const typed = q.trim().length > 0;
  const rows = typed
    ? [...(data.correction ? [{ text: data.correction, type: 'did-you-mean' }] : []), ...data.suggestions]
    : [...recent.map((t) => ({ text: t, type: 'recent' })), ...data.suggestions];

  const go = (text) => {
    const t = text.trim(); if (!t) return;
    pushRecent(t); setOpen(false);
    const next = new URLSearchParams({ q: t });
    if (window.location.pathname === '/search') { const cur = new URLSearchParams(window.location.search); for (const k of ['model', 'sort', 'syn', 'scores']) if (cur.get(k)) next.set(k, cur.get(k)); }
    router.push('/search?' + next);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % Math.max(rows.length, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? rows.length - 1 : a - 1)); }
    else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Enter') { e.preventDefault(); go(active >= 0 && rows[active] ? rows[active].text : q); }
  };
  const bold = (text) => { const lq = q.trim().toLowerCase(); return typed && text.startsWith(lq) ? <><b className="font-bold text-ink">{text.slice(0, lq.length)}</b>{text.slice(lq.length)}</> : text; };
  const hero = variant === 'hero';

  return (
    <div ref={box} className="relative w-full">
      <div className={`flex items-center gap-3 border bg-white transition focus-within:border-ink focus-within:shadow-lift ${hero ? 'rounded-full border-line px-6 py-4 shadow-soft' : 'rounded-full border-line px-4 py-2.5'}`}>
        <SearchIcon className="shrink-0 text-muted" width={hero ? 22 : 18} height={hero ? 22 : 18} />
        <input value={q} autoFocus={autoFocus} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => { setRecent(getRecent()); setOpen(true); }} onKeyDown={onKey}
          placeholder={hero ? 'Search 5,000 products, try “couch” or “wireles headphones”' : 'Search products…'}
          aria-label="Search products" role="combobox" aria-expanded={open} aria-autocomplete="list" autoComplete="off" spellCheck={false}
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted/70 ${hero ? 'text-lg' : 'text-sm'}`} />
        {q && <button onClick={() => { setQ(''); setOpen(true); }} aria-label="Clear" className="text-muted hover:text-ink"><CloseIcon width={16} height={16} /></button>}
        <button onClick={() => go(q)} className={`shrink-0 rounded-full bg-ink font-semibold text-white transition hover:bg-accent ${hero ? 'px-6 py-2.5 text-sm' : 'px-4 py-1.5 text-xs'}`}>Search</button>
      </div>

      {open && (rows.length > 0 || data.products.length > 0) && (
        <div className="pop-in absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-3xl border border-line bg-white p-2 shadow-lift">
          {rows.length > 0 && (
            <ul role="listbox" className="p-1">
              <li className="flex items-center justify-between px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">
                {typed ? 'Suggestions' : recent.length ? 'Recent & trending' : 'Trending searches'}
                {!typed && recent.length > 0 && <button onClick={() => { clearRecent(); setRecent([]); }} className="normal-case tracking-normal underline-offset-2 hover:underline">Clear recent</button>}
              </li>
              {rows.map((r, i) => {
                const Icon = ICON[r.type] ?? SearchIcon;
                return (
                  <li key={r.type + r.text} role="option" aria-selected={i === active}>
                    <button onMouseEnter={() => setActive(i)} onClick={() => go(r.text)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted ${i === active ? 'bg-paper' : ''}`}>
                      <Icon width={16} height={16} className="shrink-0" />
                      <span className="flex-1 truncate">{r.type === 'did-you-mean' ? <>Did you mean <b className="text-ink">{r.text}</b>?</> : bold(r.text)}</span>
                      {(r.type === 'brand' || r.type === 'category') && <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{r.type}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {typed && data.products.length > 0 && (
            <div className="border-t border-line p-1 pt-2">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Products</div>
              {data.products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-paper">
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-paper"><ProductImage src={p.image} alt="" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.title}</span><span className="block text-xs text-muted">{p.brand} · {p.subcategory}</span></span>
                  <span className="text-sm font-bold">{money(p.price)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
