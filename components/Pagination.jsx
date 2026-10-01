import Link from 'next/link';

export default function Pagination({ page, pages, qs }) {
  if (pages <= 1) return null;
  const href = (p) => { const n = new URLSearchParams(qs); p === 1 ? n.delete('page') : n.set('page', p); return `/search?${n}`; };
  const nums = [...new Set([1, 2, page - 1, page, page + 1, pages - 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const cls = 'grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm font-semibold transition';
  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 && <Link href={href(page - 1)} className={`${cls} border-line bg-white hover:border-ink`}>← Prev</Link>}
      {nums.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - nums[i - 1] > 1 && <span className="text-muted">…</span>}
          <Link href={href(p)} aria-current={p === page ? 'page' : undefined} className={`${cls} ${p === page ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'}`}>{p}</Link>
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)} className={`${cls} border-line bg-white hover:border-ink`}>Next →</Link>}
    </nav>
  );
}
