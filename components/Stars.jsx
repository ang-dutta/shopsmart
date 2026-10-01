export default function Stars({ rating, count, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted" title={`${rating} out of 5`}>
      <span className="relative inline-block leading-none" style={{ fontSize: size }} aria-hidden>
        <span className="text-line">★★★★★</span>
        <span className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-sun" style={{ width: `${(rating / 5) * 100}%` }}>★★★★★</span>
      </span>
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      {count != null && <span>({count.toLocaleString()})</span>}
    </span>
  );
}
