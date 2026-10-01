// Spelling correction: Damerau-Levenshtein (optimal string alignment) against the corpus lexicon,
// ties broken by document frequency (a "noisy-channel" prior: common words are more likely intended).
import { normalize, STOPWORDS } from './text.js';
import { SYNONYM_WORDS } from './synonyms.js';

const cache = new WeakMap();
const entries = (lex) => { let e = cache.get(lex); if (!e) cache.set(lex, (e = Object.entries(lex).map(([w, df]) => ({ w, df })))); return e; };
const own = (lex, w) => Object.hasOwn(lex, w);

/** Edit distance with adjacent transpositions; bails out early once it exceeds `max`. */
export function editDistance(a, b, max = 2) {
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  let prev2 = null, prev = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const cur = [i]; let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v; if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[lb];
}

export function bestCandidate(word, lex) {
  const max = word.length <= 4 ? 1 : 2;
  let best = null;
  for (const e of entries(lex)) {
    if (Math.abs(e.w.length - word.length) > max) continue;
    const d = editDistance(word, e.w, max);
    if (d > max) continue;
    if (!best || d < best.d || (d === best.d && e.df > best.df)) best = { w: e.w, d, df: e.df };
  }
  return best?.w ?? null;
}

/** Corrects out-of-vocabulary words. Also repairs run-together words ("airfryer" -> "air fryer"). */
export function correctQuery(q, lex) {
  let changed = false;
  const out = normalize(q).split(/([^a-z0-9]+)/).map((tok) => {
    if (!/^[a-z]{3,}$/.test(tok) || own(lex, tok) || SYNONYM_WORDS.has(tok) || STOPWORDS.has(tok)) return tok;
    for (let i = 3; i <= tok.length - 3; i++) if (own(lex, tok.slice(0, i)) && own(lex, tok.slice(i))) { changed = true; return `${tok.slice(0, i)} ${tok.slice(i)}`; }
    const c = bestCandidate(tok, lex);
    if (c) { changed = true; return c; }
    return tok;
  });
  return { text: out.join('').replace(/\s+/g, ' ').trim(), changed };
}

export const prefixWords = (lex, prefix, n = 6) =>
  entries(lex).filter((e) => e.w.startsWith(prefix)).sort((a, b) => b.df - a.df).slice(0, n).map((e) => e.w);
