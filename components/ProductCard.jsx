'use client';
import Link from 'next/link';
import ProductImage from './ProductImage';
import Stars from './Stars';
import Highlight from './Highlight';
import { EyeIcon } from './Icons';
import { money } from '@/lib/format';

export default function ProductCard({ item, showScore, onQuick, className = '' }) {
  const p = item.product;
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift ${className}`}>
      <Link href={`/product/${p.id}`} className="relative block aspect-square overflow-hidden bg-paper" aria-label={p.title}>
        <ProductImage src={p.image} alt={p.title} className="transition duration-500 group-hover:scale-105" />
        {item.badge && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-forest shadow-sm backdrop-blur">{item.badge}</span>}
        {showScore && item.score > 0 && <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 font-mono text-[11px] text-white">score {item.score}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted">{p.brand}</div>
        <Link href={`/product/${p.id}`} className="line-clamp-2 text-[15px] font-semibold leading-snug hover:text-accent">
          <Highlight segs={item.titleSegs} fallback={p.title} />
        </Link>
        <Stars rating={p.rating} count={p.reviews} />
        {item.snippetSegs && <p className="line-clamp-2 text-[13px] leading-relaxed text-muted"><Highlight segs={item.snippetSegs} /></p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold tracking-tight">{money(p.price)}</span>
          <button onClick={() => onQuick?.(item)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white">
            <EyeIcon width={14} height={14} /> Quick view
          </button>
        </div>
      </div>
    </article>
  );
}
