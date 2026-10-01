// Loads the pre-built JSON artefacts once per server instance (cached on globalThis so dev-mode HMR reuses them).
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'data', 'processed');
const read = (f) => {
  const file = path.join(DIR, f);
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Run \`npm run data\` to generate data and build the index.`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

export function getData() {
  if (globalThis.__shopsmart) return globalThis.__shopsmart;
  const products = read('products.json'), popularity = read('popularity.json');
  const d = {
    products, popularity, index: read('index.json'), lexicon: read('lexicon.json'), suggest: read('suggest.json'),
    similar: read('similar.json'), alsoBought: read('also-bought.json'), meta: read('meta.json'),
    idToPos: new Map(products.map((p, i) => [p.id, i])),
  };
  d.byPopularity = products.map((_, i) => i).sort((a, b) => popularity[b] - popularity[a]);
  return (globalThis.__shopsmart = d);
}

export function getEvalQueries() {
  const f = path.join(process.cwd(), 'data', 'eval', 'queries.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
}
