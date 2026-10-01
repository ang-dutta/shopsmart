// Offline pipeline:  data/raw/*.csv  ->  data/processed/*.json  (inverted index, lexicon, suggestions, recommender tables)
import fs from 'node:fs';
import path from 'node:path';
import { parseCSV, normalizeProduct } from '../lib/csv.js';
import { buildIndex, buildLexicon, buildSuggestions } from '../lib/ir/indexer.js';
import { buildSimilar, buildAlsoBought } from '../lib/reco/build.js';

const ROOT = process.cwd(), OUT = path.join(ROOT, 'data', 'processed');
fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const time = (label, fn) => { const s = Date.now(); const r = fn(); console.log(`  ${label.padEnd(28)} ${Date.now() - s} ms`); return r; };
const write = (name, obj) => { const f = path.join(OUT, name); fs.writeFileSync(f, JSON.stringify(obj)); return `${name} (${(fs.statSync(f).size / 1e6).toFixed(2)} MB)`; };

const rawProducts = path.join(ROOT, 'data', 'raw', 'products.csv');
if (!fs.existsSync(rawProducts)) throw new Error('data/raw/products.csv not found - run `npm run data:generate` or add your own CSV.');
const products = parseCSV(fs.readFileSync(rawProducts, 'utf8')).map(normalizeProduct).filter((p) => p.title);
const N = products.length;
const idToPos = new Map(products.map((p, i) => [p.id, i]));
const subOf = products.map((p) => p.subcategory);
console.log(`Building ShopSmart index for ${N} products`);

const index = time('inverted index', () => buildIndex(products));
const lexicon = time('spell-check lexicon', () => buildLexicon(products));
const similar = time('similar products (TF-IDF)', () => buildSimilar(index));

let events = [];
const ev = path.join(ROOT, 'data', 'raw', 'interactions.csv');
if (fs.existsSync(ev)) events = parseCSV(fs.readFileSync(ev, 'utf8'));
let { alsoBought, popularity } = time('also-bought (item-item CF)', () => buildAlsoBought(events, idToPos, subOf, N));
if (!events.length) popularity = products.map((p) => p.rating * Math.log(p.reviews + 2));
const suggest = time('autocomplete phrases', () => buildSuggestions(products, popularity));

const cats = {};
for (const p of products) cats[p.category] = (cats[p.category] || 0) + 1;
const meta = { builtAt: new Date().toISOString(), products: N, terms: Object.keys(index.terms).length, postings: Object.values(index.terms).reduce((s, a) => s + a.length / 2, 0),
  avgdl: index.avgdl, events: events.length, users: new Set(events.map((e) => e.user_id)).size, categories: cats, brands: new Set(products.map((p) => p.brand)).size };

console.log('Files:', [write('products.json', products), write('index.json', index), write('lexicon.json', lexicon), write('suggest.json', suggest),
  write('similar.json', similar), write('also-bought.json', alsoBought), write('popularity.json', popularity.map((x) => +x.toFixed(2))), write('meta.json', meta)].join('\n       '));
console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)} s - ${meta.terms} unique terms, ${meta.postings} postings.`);
