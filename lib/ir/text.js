// Text analysis pipeline: normalise -> tokenise -> remove stopwords -> stem.
import { porterStem } from './porter.js';

export const STOPWORDS = new Set(('a about after again all also am an and any are as at be because been before being below between both but by ' +
  'can could did do does doing during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my ' +
  'no nor not of on once only or other our ours own same she should so some such than that the their theirs them then there these they this those through ' +
  'to too until very was we were what when where which while who whom why will with would you your yours').split(' '));

export function normalize(text) {
  return String(text ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’`]/g, '');
}

/** Split into lowercase alphanumeric words (no stopword removal, no stemming). */
export function words(text) {
  return normalize(text).split(/[^a-z0-9]+/).filter((t) => t.length > 1 || /\d/.test(t));
}

export function stemWord(w) {
  return /^[a-z]+$/.test(w) ? porterStem(w) : w; // never stem tokens containing digits ("4k", "500ml")
}

/** Full analysis chain used for both documents and queries: returns stems. */
export function analyze(text) {
  const out = [];
  for (const w of words(text)) if (!STOPWORDS.has(w)) out.push(stemWord(w));
  return out;
}
