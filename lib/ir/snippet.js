// Highlighted snippets: pick the description sentence(s) with most query-term hits, then mark matching words.
import { normalize, stemWord, STOPWORDS } from './text.js';

export function segments(text, stemSet) {
  const out = []; let last = 0;
  for (const m of text.matchAll(/[A-Za-z0-9\u00C0-\u024F]+/g)) {
    const w = normalize(m[0]);
    if (STOPWORDS.has(w) || !stemSet.has(stemWord(w))) continue;
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    out.push({ t: m[0], h: 1 }); last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out.length ? out : [{ t: text }];
}

export function makeSnippet(desc, stemSet, max = 190) {
  const sents = desc.split(/(?<=[.!?])\s+/);
  const hits = sents.map((s) => segments(s, stemSet).filter((x) => x.h).length);
  let best = 0; hits.forEach((h, i) => { if (h > hits[best]) best = i; });
  let text = sents[best];
  if (text.length < max * 0.55 && sents[best + 1]) text += ' ' + sents[best + 1];
  if (text.length > max) text = text.slice(0, text.lastIndexOf(' ', max) > 40 ? text.lastIndexOf(' ', max) : max) + '…';
  return segments(text, stemSet);
}
