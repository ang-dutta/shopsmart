// Renders [{t, h?}] segments produced by the snippet builder, wrapping hits in <mark>.
export default function Highlight({ segs, fallback }) {
  if (!segs) return fallback ?? null;
  return segs.map((s, i) => (s.h ? <mark key={i} className="hl">{s.t}</mark> : <span key={i}>{s.t}</span>));
}
