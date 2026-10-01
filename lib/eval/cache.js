import { getData, getEvalQueries } from '../data.js';
import { runEvaluation } from './run.js';

export function getEvaluation() {
  if (!globalThis.__shopsmartEval) {
    const queries = getEvalQueries();
    globalThis.__shopsmartEval = queries.length ? runEvaluation(getData(), queries) : null;
  }
  return globalThis.__shopsmartEval;
}
