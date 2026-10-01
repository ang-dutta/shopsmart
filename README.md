# ShopSmart: product search & recommendation, built from scratch

An Information Retrieval course project: a full e-commerce search engine and recommender written in plain JavaScript (Next.js App Router, no TypeScript, no search library, no database). Deploys to Vercel as a single project.

**Features:** sign in and a per-user cart · tokenisation · stopwords · Porter stemming · prebuilt inverted index (JSON) · TF-IDF cosine and BM25 with a UI switch · autocomplete · spelling correction ("Showing results for…") · synonym expansion · category / brand / price / rating facets · sorting · highlighted snippets · similar products · customers also bought · recommended for you (localStorage) · offline evaluation (P@k, R@k, MAP, MRR, nDCG) on `/evaluation`.

---

## Quick start

```bash
npm install
npm run data        # generate 5,000 products + 65k interactions + eval queries, then build the index (~10 s)
npm run dev         # http://localhost:3000
npm test            # unit tests (stemmer, metrics, ranking, CSV, auth helpers)
npm run eval        # print the evaluation table in the terminal
```

`npm run build` runs `npm run data` first (`prebuild`), so Vercel needs no extra step.

### Using your own products CSV
Put it at `data/raw/products.csv` **before** running `npm run data`. Columns (header names are case-insensitive): `id, title, description, category, subcategory, brand, price, rating, review_count, image`. Only `title` is required; missing columns get defaults (`subcategory` → `category`, empty `image` → generated placeholder). Your file is never overwritten unless you pass `--force`.
Interactions are still generated (from your product ids). The evaluation queries are generated only for the synthetic catalogue - for your CSV, write `data/eval/queries.json` yourself:

```json
[{ "id": "q1", "kind": "category", "query": "wireless headphones", "qrels": { "P00012": 2, "P00340": 1 } }]
```
`qrels` maps product id → grade (2 = perfect, 1 = partially relevant; anything missing = 0). A practical way to build judgments is pooling: run each query through both rankers, take the union of the top 20, and grade those by hand.

---

## Project layout

```
app/                    pages (/, /search, /product/[id], /cart, /login, /evaluation) + API routes (/api/search, suggest, recommend, product/[id], evaluate, img)
components/             UI (SearchBox, SearchLayout = filters + sort + model switch, ProductCard, QuickView, …)
lib/ir/                 porter.js  text.js  synonyms.js  spell.js  indexer.js  search.js  snippet.js  suggest.js
lib/reco/               build.js (offline) · recommend.js (runtime)
lib/eval/               metrics.js · run.js · cache.js
scripts/                generate-data.mjs · build-index.mjs · evaluate-cli.mjs
data/raw/               products.csv, interactions.csv          (inputs)
data/processed/         index.json, products.json, lexicon.json, suggest.json, similar.json, also-bought.json, …  (built)
data/eval/queries.json  test queries + relevance judgments
```

## Login and cart (Supabase)

- Accounts use **Supabase Auth** (email and password). Carts are stored in the Postgres table `cart_items` (`supabase/schema.sql`), protected by **row level security**, so the database itself only ever returns the signed-in user's own rows.
- Clicking **Add to cart** while signed out sends you to `/login` and back. `/cart` has quantity controls, remove, an order summary and a demo checkout (nothing is charged). The header shows a cart badge and an account menu with sign out. Cart items also feed "Recommended for you".
- Code: `lib/supabase.js` (browser client), `lib/auth.js` (register, login, logout), `lib/useAuth.js` (React hook), `lib/cart.js` (cart queries).

### Setup
1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Authentication, Providers: enable **Email**. For a demo, switch **Confirm email** off.
3. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key (Project Settings, API Keys).
4. Authentication, URL Configuration: set the Site URL to your Vercel address and add `http://localhost:3000/**` and `https://<your-project>.vercel.app/**` as redirect URLs.
5. On Vercel, add the same environment variables and redeploy (`NEXT_PUBLIC_` values are fixed at build time).

Never put the Supabase `service_role` key in a `NEXT_PUBLIC_` variable. The publishable key is safe in the browser only because row level security is on.

---

## The algorithms

### 1. Text analysis (`lib/ir/text.js`, `porter.js`)
The same chain is applied to documents and queries, which is what makes matching possible:
1. **Normalise**: Unicode NFKD, strip accents, lowercase, drop apostrophes.
2. **Tokenise**: split on anything that is not `[a-z0-9]`; drop 1-letter tokens.
3. **Stopword removal**: ~130 function words ("the", "and", "with"…).
4. **Stemming**: the Porter (1980) algorithm, implemented from scratch: five rule steps that strip suffixes only when the remaining stem is long enough (the "measure" *m* of consonant-vowel sequences). `headphones → headphon`, `running → run`, `batteries → batteri`. Tokens containing digits (`4k`, `500ml`) are left alone.

### 2. Inverted index (`lib/ir/indexer.js`, built by `scripts/build-index.mjs`)
For each stem the index stores a **posting list** `[doc, tf, doc, tf, …]`. Also stored: document lengths, the average length, and each document's TF-IDF vector norm. It is serialised to `data/processed/index.json` (~1 MB for 5,000 products) and loaded once per server instance - a query only touches the postings of its own terms rather than scanning every product.

**Field weighting** is done by repetition: title ×3, brand ×2, category/sub-category ×2, description ×1. A word in the title therefore counts three times in *tf*, and document length includes the repetitions.

### 3. Ranking (`lib/ir/search.js`)
Let *N* = number of documents, *df(t)* = documents containing *t*, *tf(t,d)* = term count in *d*.

**TF-IDF with cosine similarity**

- weight of a term in a document: `w(t,d) = (1 + ln tf) · idf(t)`, where `idf(t) = ln(1 + N/df)` (smoothed so it never hits 0)
- the query is a vector too: `w(t,q) = weight(t) · idf(t)`
- `score(d) = Σ w(t,q)·w(t,d) / (‖q‖·‖d‖)` - the cosine of the angle between the query and document vectors. Dividing by ‖d‖ stops long documents winning just by being long.

**BM25 (Okapi)**

```
score(d) = Σ_t  idf(t) · tf·(k1+1) / ( tf + k1·(1 − b + b·|d|/avgdl) ) · weight(t)
idf(t)   = ln(1 + (N − df + 0.5)/(df + 0.5)),   k1 = 1.2,  b = 0.75
```
Two ideas separate it from TF-IDF: **term-frequency saturation** (the 10th occurrence of a word adds much less than the 2nd; `k1` controls how fast) and **length normalisation** that is tunable (`b`=0 ignores length, `b`=1 fully normalises).

**Candidate selection.** Both models are OR-queries ranked by score, with a "minimum should match" rule so long queries don't return everything: queries of ≥3 words must match at least half of their words (a word and its synonyms count as one). Scoring is a term-at-a-time accumulation into a `Float64Array`, so a typical query takes a few milliseconds.

### 4. Query understanding
- **Spelling correction** (`spell.js`). A query word that is not in the corpus lexicon (or synonym table) is replaced by the closest lexicon word by **Damerau-Levenshtein distance** (insert, delete, substitute, adjacent swap; max 1 edit for short words, 2 for longer). Ties are broken by document frequency - a simple noisy-channel prior, since common words are more likely to be intended. Run-together words are split (`airfryer → air fryer`). The UI says *"Showing results for …"* with a link to search the original spelling, or *"Did you mean…"* when nothing matched.
- **Synonym expansion** (`synonyms.js`). A hand-curated table (`couch ↔ sofa`, `tv ↔ television`, `trainers ↔ sneakers`…). Synonyms are added to the query at **weight 0.4**, so exact matches always outrank synonym matches. It can be switched off in the UI.
- **Autocomplete** (`suggest.js`). Build time: categories, sub-categories, brands and frequent title bi/trigrams (≥8 occurrences) become phrases scored by frequency. Runtime: phrases that start with the input rank first, then phrases containing all typed words with the last one as a prefix. Product hits come from an actual search where the last word is expanded to its most frequent lexicon completions ("search as you type").
- **Snippets** (`snippet.js`). The description sentence(s) with the most query-stem hits are selected, then every token whose stem is in the query is wrapped in `<mark>`.

### 5. Filters, facets, sorting
Filters are applied to the ranked candidate set. Facet counts follow the convention used by real shops: **each facet ignores its own filter** (so picking "Electronics" doesn't make every other category show 0). Sorting by price or rating replaces the relevance order; ties fall back to popularity.

### 6. Recommendations (`lib/reco/`)
- **Similar products (content-based).** Every product's TF-IDF vector is compared against all others through the inverted index at build time; the top 12 cosine neighbours are stored in `similar.json`.
- **Customers also bought (collaborative).** From `interactions.csv` build a user × item matrix with implicit feedback weights *view = 1, add-to-cart = 3, purchase = 5*. Item-item similarity is the cosine between item columns: `sim(i,j) = Σ_u w_ui·w_uj / (‖i‖·‖j‖)`. Pairs from the same sub-category are skipped on purpose - alternatives belong under "Similar"; "also bought" should surface complements (laptop → mouse). Sparse items are topped up with popular products from the same category.
- **Recommended for you (hybrid, personalised).** The browser keeps the last 30 viewed product ids in `localStorage`. `POST /api/recommend` builds a **profile vector**: the recency-decayed (×0.85 per step) sum of the viewed products' normalised TF-IDF vectors - scores it against the index by cosine, adds the collaborative neighbours of the same products, and blends: `0.65·content + 0.35·collab` (each max-normalised). Viewed items are removed and results are diversified (≤3 per sub-category first). With no history the row shows trending products.

### 7. Evaluation (`lib/eval/`, page `/evaluation`)
For each query the top-100 ranking is compared with the judgments (`qrels`):

| metric | definition |
|---|---|
| **P@k** | relevant results in the top k ÷ k |
| **R@k** | relevant results in the top k ÷ all relevant |
| **AP / MAP** | mean of P@i at each rank i where a relevant item appears, ÷ total relevant; MAP = mean of AP over queries |
| **MRR** | mean of 1/rank of the first relevant result |
| **nDCG@k** | `DCG = Σ (2^g − 1)/log2(i+1)` over the top k, divided by the DCG of the ideal ordering; uses the graded judgments (0/1/2) |

Four systems are compared: TF-IDF, BM25, and each with synonym expansion. A paired t-test on per-query AP says whether the BM25-vs-TF-IDF gap is real (normal approximation of the p-value; fine for n ≥ 30). Results are also broken down by query type (category, synonym, attribute, brand, misspelled).

**Caveat worth writing in your report.** On the synthetic catalogue, judgments come from the generator's hidden ground truth (type, attributes, brand), *not* from the text the engine indexes, so the evaluation is not circular. But the product text is templated and short, so TF-IDF and BM25 land close together; the clearest effect is synonym expansion on queries like "couch" or "tee", whose words often don't appear in the product text at all. On a real catalogue with long, varied descriptions, BM25's saturation and length normalisation typically matter more.

---

## API

| route | purpose |
|---|---|
| `GET /api/search?q=&model=bm25\|tfidf&category=&brand=&min=&max=&rating=&sort=&page=&syn=0\|1&exact=1` | ranked results, facets, timing |
| `GET /api/suggest?q=` | autocomplete phrases + product hits |
| `GET /api/product/:id` | product + similar + also-bought |
| `GET /api/products?ids=a,b` | products by id (used by the cart page) |
| `POST /api/recommend` `{viewed:[ids], cart:[ids]}` | personalised recommendations |
| `GET /api/evaluate` | full evaluation JSON |
| `GET /api/img?e=🎧&h=210&s=7` | generated placeholder product image (SVG) |

## Deploying to Vercel
1. Push the repo to GitHub (commit `data/raw/` and `data/eval/`; `data/processed/` may be committed too or rebuilt).
2. Import it at vercel.com/new - framework preset *Next.js*, default settings. The `build` script regenerates the index; `outputFileTracingIncludes` in `next.config.mjs` ships `data/processed` and `data/eval` with the serverless functions.
3. Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and optionally `NEXT_PUBLIC_CURRENCY` (default `USD`, e.g. `INR`).

## Ideas to extend it
Phrase queries with positional postings · query-time field boosts · learning-to-rank from click logs · BM25F · dense embeddings for re-ranking · A/B comparison of `k1`/`b` on the evaluation page.
