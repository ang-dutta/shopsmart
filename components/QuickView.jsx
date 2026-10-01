'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import ProductImage from './ProductImage';
import Stars from './Stars';
import AddToCart from './AddToCart';
import { CloseIcon, ArrowIcon } from './Icons';
import { money } from '@/lib/format';

export default function QuickView({ item, onClose }) {
  const p = item.product;
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={p.title}>
      <div className="pop-in relative grid max-h-[92dvh] w-full max-w-3xl overflow-auto rounded-t-3xl bg-card shadow-lift sm:rounded-3xl md:grid-cols-2">
        <button onClick={onClose} aria-label="Close quick view" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft transition hover:bg-ink hover:text-white"><CloseIcon /></button>
        <div className="aspect-square bg-paper md:aspect-auto md:min-h-[26rem]"><ProductImage src={p.image} alt={p.title} /></div>
        <div className="flex flex-col gap-3 p-6 sm:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{p.brand} · {p.subcategory}</div>
          <h2 className="font-display text-3xl leading-tight">{p.title}</h2>
          <Stars rating={p.rating} count={p.reviews} size={16} />
          <div className="text-2xl font-bold tracking-tight">{money(p.price)}</div>
          <p className="text-sm leading-relaxed text-muted">{p.description}</p>
          {item.score > 0 && <p className="rounded-xl bg-forest-soft px-3 py-2 font-mono text-xs text-forest">retrieval score: {item.score}</p>}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
            <AddToCart id={p.id} />
            <Link href={`/product/${p.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">Full details <ArrowIcon width={16} height={16} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
