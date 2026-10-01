// Porter stemmer (Porter, 1980) - the classic suffix-stripping algorithm, implemented from scratch.
const step2 = { ational: 'ate', tional: 'tion', enci: 'ence', anci: 'ance', izer: 'ize', bli: 'ble', alli: 'al', entli: 'ent', eli: 'e', ousli: 'ous', ization: 'ize', ation: 'ate', ator: 'ate', alism: 'al', iveness: 'ive', fulness: 'ful', ousness: 'ous', aliti: 'al', iviti: 'ive', biliti: 'ble', logi: 'log' };
const step3 = { icate: 'ic', ative: '', alize: 'al', iciti: 'ic', ical: 'ic', ful: '', ness: '' };
const c = '[^aeiou]', v = '[aeiouy]', C = c + '[^aeiouy]*', V = v + '[aeiou]*';
const mGt0 = new RegExp('^(' + C + ')?' + V + C);            // measure m > 0
const mEq1 = new RegExp('^(' + C + ')?' + V + C + '(' + V + ')?$'); // measure m = 1
const mGt1 = new RegExp('^(' + C + ')?' + V + C + V + C);     // measure m > 1
const hasVowel = new RegExp('^(' + C + ')?' + v);
const cvc = new RegExp('^' + C + v + '[^aeiouwxy]$');

export function porterStem(w) {
  if (w.length < 3) return w;
  const first = w[0];
  if (first === 'y') w = 'Y' + w.slice(1);
  let m, stem;

  // Step 1a - plurals
  if (/^(.+?)(ss|i)es$/.test(w)) w = w.replace(/^(.+?)(ss|i)es$/, '$1$2');
  else if (/^(.+?)([^s])s$/.test(w)) w = w.replace(/^(.+?)([^s])s$/, '$1$2');

  // Step 1b - -eed / -ed / -ing
  if ((m = /^(.+?)eed$/.exec(w))) { if (mGt0.test(m[1])) w = w.slice(0, -1); }
  else if ((m = /^(.+?)(ed|ing)$/.exec(w)) && hasVowel.test(m[1])) {
    w = m[1];
    if (/(at|bl|iz)$/.test(w)) w += 'e';
    else if (/([^aeiouylsz])\1$/.test(w)) w = w.slice(0, -1);
    else if (cvc.test(w)) w += 'e';
  }

  // Step 1c - y -> i
  if ((m = /^(.+?)y$/.exec(w)) && hasVowel.test(m[1])) w = m[1] + 'i';

  // Steps 2 & 3 - map double suffixes to single ones
  if ((m = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/.exec(w)) && mGt0.test(m[1])) w = m[1] + step2[m[2]];
  if ((m = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/.exec(w)) && mGt0.test(m[1])) w = m[1] + step3[m[2]];

  // Step 4 - strip suffixes when m > 1
  if ((m = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/.exec(w))) { if (mGt1.test(m[1])) w = m[1]; }
  else if ((m = /^(.+?)(s|t)(ion)$/.exec(w))) { stem = m[1] + m[2]; if (mGt1.test(stem)) w = stem; }

  // Step 5 - final -e and -ll
  if ((m = /^(.+?)e$/.exec(w))) { if (mGt1.test(m[1]) || (mEq1.test(m[1]) && !cvc.test(m[1]))) w = m[1]; }
  if (/ll$/.test(w) && mGt1.test(w)) w = w.slice(0, -1);

  return first === 'y' ? 'y' + w.slice(1) : w;
}
