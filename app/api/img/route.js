// Generates a tasteful placeholder product image (gradient + emoji) so the demo needs no external image hosting.
export function GET(req) {
  const sp = new URL(req.url).searchParams;
  const e = (sp.get('e') || '🛍️').slice(0, 8), h = (parseInt(sp.get('h'), 10) || 20) % 360, s = parseInt(sp.get('s'), 10) || 0;
  const r = (n) => ((s * 9301 + n * 49297) % 233280) / 233280;
  const rot = Math.round(r(1) * 40 - 20), size = 190 + Math.round(r(2) * 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 70% 93%)"/><stop offset="1" stop-color="hsl(${(h + 28) % 360} 62% 82%)"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<circle cx="${80 + Math.round(r(3) * 240)}" cy="${60 + Math.round(r(4) * 60)}" r="${90 + Math.round(r(5) * 60)}" fill="hsl(${h} 80% 97%)" opacity=".55"/>
<ellipse cx="200" cy="330" rx="${size / 2.1}" ry="14" fill="hsl(${h} 40% 30%)" opacity=".14"/>
<text x="200" y="245" font-size="${size}" text-anchor="middle" transform="rotate(${rot} 200 220)" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${e}</text></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
