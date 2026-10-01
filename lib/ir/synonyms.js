// Hand-curated synonym groups (single tokens only). Expansion is applied at query time
// with a reduced weight, so exact matches always outrank synonym matches.
const GROUPS = [
  ['tv', 'television', 'televisions'], ['laptop', 'notebook', 'ultrabook'], ['phone', 'smartphone', 'mobile', 'cellphone'],
  ['headphones', 'headset', 'earphones'], ['earbuds', 'earphones', 'airpods'], ['sneakers', 'trainers', 'kicks'],
  ['couch', 'sofa', 'settee'], ['sunglasses', 'shades'], ['jacket', 'coat'], ['jeans', 'denim'], ['tee', 'tshirt', 'shirt'],
  ['handbag', 'purse'], ['bike', 'bicycle'], ['drone', 'quadcopter'], ['cheap', 'affordable', 'budget'],
  ['fryer', 'airfryer'], ['monitor', 'screen', 'display'], ['lamp', 'light'], ['dumbbell', 'dumbbells', 'weights'],
  ['perfume', 'fragrance', 'cologne'], ['moisturizer', 'moisturiser', 'lotion', 'cream'], ['tent', 'shelter'],
  ['flask', 'bottle'], ['rucksack', 'backpack', 'knapsack'], ['puzzle', 'jigsaw'], ['plush', 'stuffed', 'teddy'],
  ['hairdryer', 'blowdryer'], ['chair', 'seat'], ['kids', 'children', 'child'], ['women', 'womens', 'ladies', 'female'],
  ['men', 'mens', 'male'], ['small', 'compact', 'mini'], ['big', 'large'], ['color', 'colour'], ['gaming', 'gamer'],
  ['rc', 'remote'], ['diary', 'journal'], ['speaker', 'speakers'], ['fitness', 'workout'],
];

const MAP = new Map();
for (const g of GROUPS) for (const w of g) {
  if (!MAP.has(w)) MAP.set(w, new Set());
  for (const o of g) if (o !== w) MAP.get(w).add(o);
}

export const synonymsOf = (word) => [...(MAP.get(word) ?? [])];
export const hasSynonyms = (word) => MAP.has(word);
export const SYNONYM_WORDS = new Set(MAP.keys());
