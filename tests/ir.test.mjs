import test from 'node:test';
import assert from 'node:assert/strict';
import { porterStem } from '../lib/ir/porter.js';
import { analyze } from '../lib/ir/text.js';
import { editDistance } from '../lib/ir/spell.js';
import { buildIndex } from '../lib/ir/indexer.js';
import { parseQuery, scoreDocs } from '../lib/ir/search.js';
import { precisionAtK, recallAtK, averagePrecision, reciprocalRank, ndcgAtK } from '../lib/eval/metrics.js';
import { parseCSV, toCSV } from '../lib/csv.js';

test('Porter stemmer', () => {
  for (const [w, s] of Object.entries({ running: 'run', connections: 'connect', caresses: 'caress', happy: 'happi', headphones: 'headphon', batteries: 'batteri' })) assert.equal(porterStem(w), s);
});
test('analyze: lowercase, stopwords, stems, diacritics', () => {
  assert.deepEqual(analyze('The Running Shoes and a Café'), ['run', 'shoe', 'cafe']);
});
test('edit distance (with transposition)', () => {
  assert.equal(editDistance('headphnes', 'headphones'), 1);
  assert.equal(editDistance('blutooth', 'bluetooth'), 1);
  assert.equal(editDistance('sofa', 'soaf'), 1);
});
test('metrics on a hand-worked example', () => {
  const ranked = ['a', 'b', 'c', 'd', 'e'], qrels = { a: 2, c: 1, z: 1 };
  assert.equal(precisionAtK(ranked, qrels, 3), 2 / 3);
  assert.equal(recallAtK(ranked, qrels, 5), 2 / 3);
  assert.ok(Math.abs(averagePrecision(ranked, qrels) - (1 + 2 / 3) / 3) < 1e-12);
  assert.equal(reciprocalRank(['x', 'a'], qrels), 0.5);
  const dcg = 3 + 1 / Math.log2(4), idcg = 3 + 1 / Math.log2(3) + 1 / Math.log2(4);
  assert.ok(Math.abs(ndcgAtK(ranked, qrels, 5) - dcg / idcg) < 1e-12);
});
test('BM25 and TF-IDF rank the exact match first', () => {
  const mk = (title, description) => ({ title, description, brand: 'x', category: 'c', subcategory: 's' });
  const index = buildIndex([mk('red running shoes', 'light'), mk('blue coffee mug', 'ceramic mug'), mk('running jacket', 'warm')]);
  const data = { index, lexicon: { running: 2, shoes: 1 } };
  for (const model of ['bm25', 'tfidf']) {
    const { scores } = scoreDocs(index, parseQuery(data, 'running shoes', { correct: false }).terms, model);
    assert.ok(scores[0] > scores[2] && scores[2] > scores[1]);
  }
});
test('CSV round-trip with quotes and commas', () => {
  const rows = [{ a: 'x, y', b: 'say "hi"' }];
  assert.deepEqual(parseCSV(toCSV(rows, ['a', 'b'])), rows);
});
