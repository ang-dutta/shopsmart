// Generates synthetic data (deterministic, seeded):
//   data/raw/products.csv      ~5,000 products   (skipped if you already put your own CSV there; use --force to overwrite)
//   data/raw/interactions.csv  synthetic views / add_to_cart / purchase events
//   data/eval/queries.json     test queries + graded relevance judgments (only for the synthetic catalogue)
import fs from 'node:fs';
import path from 'node:path';
import { parseCSV, toCSV, normalizeProduct } from '../lib/csv.js';

const ROOT = process.cwd();
const RAW = path.join(ROOT, 'data', 'raw');
const EVAL = path.join(ROOT, 'data', 'eval');
const force = process.argv.includes('--force');
const TOTAL = 5000, USERS = 3000;
fs.mkdirSync(RAW, { recursive: true }); fs.mkdirSync(EVAL, { recursive: true });

// ---------- seeded RNG helpers ----------
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(20260929);
const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (a) => a[Math.floor(rand() * a.length)];
const sample = (a, n) => { const c = [...a], o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rand() * c.length), 1)[0]); return o; };
const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const title = (s) => s.replace(/(^|[\s-])([a-z])/g, (m, p, l) => p + l.toUpperCase());

// ---------- catalogue definition ----------
// type = [name, emoji, minPrice, maxPrice, altName, attributes[]]
const cat = (name, hue, brands, features, uses, types) => ({ name, hue, brands, features, uses, types: types.map(([n, e, lo, hi, alt, attrs]) => ({ name: n, emoji: e, price: [lo, hi], alt, attrs, cat: null })) });
const CATALOG = [
  cat('Electronics', 215, ['Auralux', 'Voltix', 'Pixelon', 'Nordvik', 'Kairo', 'Lumatek', 'Zenbyte', 'Orbita', 'Novasonic', 'Tekora'],
    ['a sleek lightweight design', 'fast USB-C charging', 'long-lasting battery life', 'intuitive controls', 'reliable everyday performance', 'a durable build with a two-year warranty', 'easy setup in minutes', 'crisp, vivid quality'],
    ['everyday use at home and at work', 'life on the go', 'commuting and travel', 'entertainment and streaming'], [
      ['Headphones', '🎧', 25, 350, 'headset', ['wireless', 'noise cancelling', 'over-ear', 'bluetooth', 'foldable', 'studio', 'gaming', 'lightweight']],
      ['Earbuds', '🎶', 15, 260, 'earphones', ['wireless', 'waterproof', 'noise cancelling', 'true wireless', 'sport', 'in-ear', 'bluetooth', 'low latency']],
      ['Smartphone', '📱', 120, 1200, 'mobile phone', ['5G', 'dual sim', 'unlocked', '128GB', 'fast charging', 'OLED display', 'long battery', 'compact']],
      ['Laptop', '💻', 350, 2200, 'notebook computer', ['ultrabook', 'gaming', '16GB RAM', 'touchscreen', 'lightweight', '1TB SSD', '14-inch', 'backlit keyboard']],
      ['Smartwatch', '⌚', 40, 450, 'wearable', ['fitness', 'waterproof', 'GPS', 'heart rate', 'AMOLED', 'sleep tracking', 'long battery', 'bluetooth calling']],
      ['Bluetooth Speaker', '🔊', 20, 300, 'wireless speaker', ['portable', 'waterproof', 'party', '360 sound', 'rugged', 'mini', 'stereo', 'bass boost']],
      ['Television', '📺', 180, 2500, 'TV', ['4K', 'smart', 'OLED', '55-inch', 'QLED', 'HDR', 'ultra slim', 'voice control']]]),
  cat('Fashion', 340, ['Maison Ora', 'Threadly', 'Velour', 'Northloom', 'Atelier Nine', 'Stridewell', 'Cove Denim', 'Linen Lane', 'Ostra', 'Fable Fern'],
    ['a flattering, comfortable fit', 'breathable premium fabric', 'careful stitching that lasts', 'easy care and machine washable', 'a timeless versatile style', 'a modern silhouette', 'a soft-touch finish', 'season after season durability'],
    ['everyday wear', 'weekends and travel', 'work and evenings out', 'layering in any season'], [
      ['Sneakers', '👟', 35, 180, 'trainers', ['leather', 'lightweight', 'slip-on', 'white', 'high-top', 'retro', 'breathable', 'cushioned']],
      ['Jacket', '🧥', 45, 320, 'coat', ['waterproof', 'insulated', 'windproof', 'leather', 'bomber', 'lightweight', 'hooded', 'quilted']],
      ['Jeans', '👖', 30, 140, 'denim trousers', ['slim fit', 'stretch', 'high-waisted', 'straight leg', 'distressed', 'organic cotton', 'dark wash', 'relaxed fit']],
      ['T-Shirt', '👕', 10, 45, 'tee', ['organic cotton', 'oversized', 'graphic', 'v-neck', 'slim fit', 'pocket', 'striped', 'breathable']],
      ['Handbag', '👜', 40, 400, 'purse', ['leather', 'crossbody', 'tote', 'mini', 'vegan leather', 'quilted', 'zip closure', 'adjustable strap']],
      ['Sunglasses', '🕶️', 15, 220, 'shades', ['polarized', 'aviator', 'round', 'UV400', 'oversized', 'lightweight', 'mirrored', 'unisex']],
      ['Dress', '👗', 30, 260, 'frock', ['floral', 'maxi', 'midi', 'linen', 'wrap', 'sleeveless', 'party', 'casual']]]),
  cat('Home & Kitchen', 30, ['Hearthly', 'Casaluna', 'Kitchenwell', 'Brewhaus', 'Oaken Ash', 'Lumiere Home', 'Pantry Co', 'Nestora', 'Copperleaf', 'Tidewell'],
    ['sturdy construction that lasts for years', 'an easy-to-clean surface', 'a space-saving footprint', 'a warm, modern look for any room', 'food-safe, BPA-free materials', 'simple assembly', 'quiet everyday operation', 'thoughtful details that make life easier'],
    ['busy family kitchens', 'small apartments', 'cosy evenings at home', 'hosting friends and family'], [
      ['Coffee Maker', '☕', 25, 320, 'coffee machine', ['programmable', 'espresso', 'single-serve', 'stainless steel', 'cold brew', 'with grinder', '12-cup', 'compact']],
      ['Blender', '🍹', 20, 220, 'smoothie maker', ['high-speed', 'personal', 'cordless', 'glass jar', 'smoothie', '1200W', 'quiet', 'with vacuum']],
      ['Air Fryer', '🍟', 45, 260, 'oil-free fryer', ['digital', 'dual basket', '5-litre', 'oil-free', 'stainless steel', 'with rack', 'compact', 'family-size']],
      ['Sofa', '🛋️', 280, 1800, 'couch', ['3-seater', 'sectional', 'velvet', 'leather', 'reclining', 'convertible', 'L-shaped', 'fabric']],
      ['Table Lamp', '💡', 15, 120, 'bedside light', ['dimmable', 'LED', 'touch control', 'minimalist', 'wooden base', 'rechargeable', 'USB port', 'bedside']],
      ['Bed Sheet Set', '🛏️', 20, 150, 'bedding set', ['cotton', 'king size', 'microfiber', '400 thread count', 'queen size', 'deep pocket', 'cooling', 'hypoallergenic']],
      ['Cookware Set', '🍳', 40, 350, 'pots and pans', ['non-stick', 'stainless steel', 'ceramic', 'induction', '10-piece', 'cast iron', 'dishwasher safe', 'copper']]]),
  cat('Sports & Outdoors', 150, ['Trailborn', 'Kinetic Peak', 'Summit Sage', 'Fieldstone', 'Aerowave', 'Ridgeline', 'Paceline', 'Wildmere', 'Boulder Co', 'Northtrek'],
    ['rugged materials built for the outdoors', 'a comfortable, secure fit', 'a lightweight yet durable build', 'a design shaped by athletes and adventurers', 'reinforced stress points', 'easy packing and carrying', 'quick-dry performance', 'confidence-inspiring grip and traction'],
    ['training and workouts', 'weekend adventures', 'trails and long hikes', 'staying active every day'], [
      ['Running Shoes', '🏃', 45, 220, 'jogging shoes', ['lightweight', 'cushioned', 'trail', 'breathable', 'waterproof', 'road', 'carbon plate', 'wide fit']],
      ['Yoga Mat', '🧘', 15, 90, 'exercise mat', ['non-slip', 'eco-friendly', 'extra thick', 'foldable', 'TPE', 'cork', 'travel', 'alignment lines']],
      ['Dumbbell Set', '🏋️', 30, 300, 'weights', ['adjustable', 'neoprene', 'rubber hex', 'cast iron', '20kg', 'chrome', 'with rack', 'space-saving']],
      ['Backpack', '🎒', 20, 180, 'rucksack', ['waterproof', 'hiking', '40-litre', 'anti-theft', 'laptop compartment', 'lightweight', 'ergonomic', 'daypack']],
      ['Camping Tent', '⛺', 40, 400, 'shelter', ['2-person', '4-person', 'waterproof', 'instant setup', 'ultralight', '4-season', 'with vestibule', 'windproof']],
      ['Mountain Bike', '🚲', 220, 1800, 'bicycle', ['aluminium frame', '29-inch', '21-speed', 'full suspension', 'disc brakes', 'lightweight', 'hardtail', 'electric']],
      ['Water Bottle', '🥤', 8, 45, 'flask', ['insulated', 'stainless steel', 'BPA-free', 'leakproof', '1-litre', 'sports cap', 'vacuum', 'collapsible']]]),
  cat('Beauty & Care', 300, ['Glowmere', 'Petalis', 'Dermaluxe', 'Solene', 'Botanica Nine', 'Aurelle', 'Velvet Root', 'Luma Skin', 'Pure Atelier', 'Mistral'],
    ['dermatologist-tested, gentle-on-skin care', 'a lightweight, non-greasy feel', 'cruelty-free and vegan formulas', 'a fresh natural scent', 'visible results with regular use', 'suitability for everyday use', 'thoughtfully sourced ingredients', 'a travel-friendly size'],
    ['your daily routine', 'special occasions', 'self-care evenings', 'travel and gifting'], [
      ['Face Serum', '🧪', 12, 90, 'skin serum', ['vitamin C', 'hyaluronic acid', 'retinol', 'niacinamide', 'brightening', 'anti-aging', 'fragrance-free', 'hydrating']],
      ['Moisturizer', '🧴', 8, 70, 'face cream', ['SPF 30', 'hydrating', 'oil-free', 'night', 'sensitive skin', 'with ceramides', 'gel', 'rich']],
      ['Perfume', '🌸', 25, 220, 'fragrance', ['floral', 'woody', 'citrus', 'eau de parfum', 'long-lasting', 'unisex', 'vanilla', 'musk']],
      ['Lipstick', '💄', 6, 45, 'lip colour', ['matte', 'long-wear', 'hydrating', 'satin', 'red', 'nude', 'vegan', 'smudge-proof']],
      ['Hair Dryer', '💇', 20, 180, 'blow dryer', ['ionic', 'foldable', '2000W', 'travel', 'with diffuser', 'quiet', 'ceramic', 'professional']],
      ['Electric Toothbrush', '🪥', 15, 150, 'powered toothbrush', ['sonic', 'rechargeable', 'with timer', 'pressure sensor', 'travel case', 'whitening', 'soft bristles', 'waterproof']],
      ['Shampoo', '🧼', 6, 40, 'hair wash', ['sulfate-free', 'argan oil', 'anti-dandruff', 'volumizing', 'keratin', 'moisturizing', 'for curly hair', 'colour-safe']]]),
  cat('Toys & Games', 45, ['Playwick', 'Brightnest', 'Tinkerly', 'Kidoro', 'Merrymint', 'Puzzlebee', 'Wonderbox', 'Bumblo', 'Funcraft', 'Skyhopper'],
    ['safe, non-toxic materials', 'hours of screen-free fun', 'a design that sparks creativity and imagination', 'sturdy construction for rough play', 'a gift-ready box', 'rules that are easy to learn', 'learning through play', 'fun for the whole family'],
    ['rainy afternoons', 'birthday gifts', 'family game night', 'curious young minds'], [
      ['Board Game', '🎲', 12, 70, 'tabletop game', ['strategy', 'family', 'cooperative', '2-player', 'party', 'card-based', 'classic', 'travel']],
      ['Building Blocks', '🧱', 15, 120, 'construction set', ['1000-piece', 'magnetic', 'wooden', 'STEM', 'colourful', 'castle', 'city', 'for toddlers']],
      ['Jigsaw Puzzle', '🧩', 8, 40, 'picture puzzle', ['1000-piece', '500-piece', 'wooden', 'landscape', 'glow-in-the-dark', '3D', 'for kids', 'panoramic']],
      ['Remote Control Car', '🚗', 20, 150, 'RC car', ['off-road', 'rechargeable', '4WD', 'high-speed', 'waterproof', 'drift', 'with LED lights', 'monster truck']],
      ['Plush Toy', '🧸', 8, 45, 'stuffed animal', ['soft', 'giant', 'hypoallergenic', 'musical', 'huggable', 'washable', 'animal', 'teddy bear']],
      ['Art Set', '🎨', 10, 80, 'painting kit', ['watercolour', '72-piece', 'acrylic', 'with easel', 'washable', 'for kids', 'professional', 'oil pastel']],
      ['Camera Drone', '🚁', 60, 900, 'quadcopter', ['4K', 'foldable', 'GPS', 'obstacle avoidance', 'beginner', 'long flight time', 'with gimbal', 'mini']]]),
  cat('Office', 260, ['Deskwell', 'Paperlane', 'Ergonova', 'Inkora', 'Workloom', 'Slatework', 'Clarity', 'Quillon', 'Monolith', 'Tidyhaus'],
    ['a clean, professional look', 'a design made for a productive workday', 'a build that handles daily use', 'a compact profile that fits any desk', 'plug-and-play convenience', 'refined materials and finish', 'comfort for hours of use', 'backing by a one-year warranty'],
    ['the home office', 'busy workdays', 'students and creators', 'a tidy, focused desk'], [
      ['Office Chair', '🪑', 90, 600, 'desk chair', ['ergonomic', 'mesh', 'lumbar support', 'adjustable', 'high-back', 'reclining', 'leather', 'with headrest']],
      ['Standing Desk', '🗄️', 150, 800, 'sit-stand desk', ['electric', 'height adjustable', 'bamboo', 'L-shaped', 'with memory presets', 'compact', 'dual motor', 'with drawers']],
      ['Journal', '📓', 4, 30, 'diary', ['hardcover', 'dotted', 'A5', 'lined', 'spiral', 'leather', 'recycled paper', 'with pen loop']],
      ['Fountain Pen', '🖊️', 12, 150, 'ink pen', ['gold nib', 'refillable', 'brass', 'lacquer', 'fine nib', 'calligraphy', 'with converter', 'gift set']],
      ['Monitor', '🖥️', 110, 900, 'display screen', ['27-inch', '4K', 'curved', 'ultrawide', '144Hz', 'IPS', 'USB-C', 'eye care']],
      ['Wireless Mouse', '🖱️', 10, 110, 'computer mouse', ['ergonomic', 'silent click', 'rechargeable', 'vertical', 'bluetooth', 'gaming', 'compact', 'multi-device']],
      ['Desk Organizer', '🗂️', 8, 60, 'desktop tidy', ['bamboo', 'mesh', 'multi-compartment', 'rotating', 'wooden', 'with drawers', 'minimalist', 'stackable']]]),
];
CATALOG.forEach((c) => c.types.forEach((t) => (t.cat = c)));
const COLORS = ['Black', 'Silver', 'Midnight Blue', 'Pearl White', 'Forest Green', 'Sand', 'Graphite', 'Rose Gold', 'Ocean Teal', 'Burgundy'];
const BUNDLES = [
  ['Laptop', 'Wireless Mouse', 'Backpack', 'Headphones', 'Monitor'], ['Smartphone', 'Smartwatch', 'Earbuds', 'Bluetooth Speaker'],
  ['Television', 'Sofa', 'Table Lamp', 'Bluetooth Speaker'], ['Coffee Maker', 'Cookware Set', 'Air Fryer', 'Blender'],
  ['Running Shoes', 'Yoga Mat', 'Dumbbell Set', 'Water Bottle', 'Smartwatch'], ['Sneakers', 'Jeans', 'T-Shirt', 'Jacket', 'Sunglasses'],
  ['Handbag', 'Dress', 'Perfume', 'Lipstick', 'Sunglasses'], ['Face Serum', 'Moisturizer', 'Shampoo', 'Hair Dryer', 'Electric Toothbrush'],
  ['Camping Tent', 'Backpack', 'Mountain Bike', 'Water Bottle'], ['Office Chair', 'Standing Desk', 'Monitor', 'Desk Organizer', 'Wireless Mouse'],
  ['Board Game', 'Jigsaw Puzzle', 'Building Blocks', 'Plush Toy', 'Art Set'], ['Remote Control Car', 'Camera Drone', 'Building Blocks'],
  ['Bed Sheet Set', 'Table Lamp', 'Sofa', 'Journal', 'Fountain Pen'],
];

// ---------- 1. products ----------
const productsCsv = path.join(RAW, 'products.csv');
const COLS = ['id', 'title', 'description', 'category', 'subcategory', 'brand', 'price', 'rating', 'review_count', 'image'];
let synthetic = false, meta = null;
if (force || !fs.existsSync(productsCsv)) {
  synthetic = true;
  const slots = shuffle(Array.from({ length: TOTAL }, (_, i) => i % CATALOG.flatMap((c) => c.types).length));
  const allTypes = CATALOG.flatMap((c) => c.types);
  const rows = []; meta = [];
  const L = 'ABCDEFGHKMNPRSTXZ';
  slots.forEach((ti, i) => {
    const t = allTypes[ti], c = t.cat, tn = t.name;
    const brand = pick(c.brands), model = pick([...L]) + pick([...L]) + '-' + ri(100, 990), color = pick(COLORS);
    let attrs = sample(t.attrs, ri(2, 3));
    attrs = attrs.filter((a, k) => !attrs.slice(0, k).some((b) => b.split(/[\s-]+/).some((w) => a.split(/[\s-]+/).includes(w)))); // no repeated words ("true wireless wireless")
    const forms = [`${brand} ${model} ${attrs[0]} ${tn}`, `${brand} ${attrs[0]} ${tn} - ${color}`, `${attrs[0]} ${attrs[1]} ${tn} by ${brand}`, `${brand} ${tn} ${model} (${attrs[0]}, ${color})`];
    const ttl = title(pick(forms)).replace(/\bBluetooth\b/g, 'Bluetooth');
    const use = pick(c.uses), use2 = pick(c.uses.filter((u) => u !== use));
    const [f1, f2, f3] = sample(c.features, 3);
    const d = [`The ${brand} ${model} is a ${attrs.join(', ')} ${tn.toLowerCase()} made for ${use}.`, `It combines ${f1} with ${f2}.`];
    if (rand() < 0.35) d.push(`A dependable ${t.alt} that also brings ${f3}.`); else if (rand() < 0.5) d.push(`You also get ${f3}.`);
    if (rand() < 0.6) d.push(`Great for ${use2}.`);
    d.push(`Available in ${color.toLowerCase()}.`);
    const [lo, hi] = t.price, tier = pick([0.75, 0.9, 1, 1.15, 1.35]);
    const price = Number((Math.round(Math.min(Math.max(lo + (hi - lo) * Math.pow(rand(), 1.6) * tier, lo * 0.9), hi * 1.2)) - 0.01).toFixed(2));
    const rating = Math.round(Math.min(5, Math.max(2.4, 4.05 + gauss() * 0.5)) * 10) / 10;
    const reviews = Math.min(20000, Math.max(2, Math.round(Math.exp(3 + gauss() * 1.6 + (rating - 4) * 1.2))));
    const id = `P${String(i + 1).padStart(5, '0')}`;
    rows.push({ id, title: ttl, description: d.join(' '), category: c.name, subcategory: tn, brand, price, rating, review_count: reviews,
      image: `/api/img?e=${encodeURIComponent(t.emoji)}&h=${(c.hue + ri(-14, 14) + 360) % 360}&s=${i}` });
    meta.push({ id, type: tn, alt: t.alt, attrs, brand });
  });
  fs.writeFileSync(productsCsv, toCSV(rows, COLS));
  console.log(`✓ wrote ${rows.length} synthetic products -> data/raw/products.csv`);
} else console.log('• data/raw/products.csv exists - using your CSV (run with --force to regenerate synthetic data)');

const products = parseCSV(fs.readFileSync(productsCsv, 'utf8')).map(normalizeProduct);

// ---------- 2. interactions ----------
const eventsCsv = path.join(RAW, 'interactions.csv');
if (force || synthetic || !fs.existsSync(eventsCsv)) {
  const byType = new Map();
  for (const p of products) {
    const w = Math.pow(Math.max(p.rating, 1), 3) * Math.log(p.reviews + 3) * Math.exp(gauss() * 0.7); // latent popularity
    if (!byType.has(p.subcategory)) byType.set(p.subcategory, []);
    byType.get(p.subcategory).push({ id: p.id, w });
  }
  for (const list of byType.values()) { let acc = 0; for (const x of list) { acc += x.w; x.c = acc; } }
  const pickW = (type) => { const l = byType.get(type), r = rand() * l[l.length - 1].c; let lo = 0, hi = l.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (l[m].c < r) lo = m + 1; else hi = m; } return l[lo].id; };
  let bundles = BUNDLES.map((b) => b.filter((t) => byType.has(t))).filter((b) => b.length >= 3);
  if (!bundles.length) { // custom CSV: fall back to "all sub-categories of a category"
    const m = new Map(); for (const p of products) { if (!m.has(p.category)) m.set(p.category, new Set()); m.get(p.category).add(p.subcategory); }
    bundles = [...m.values()].map((s) => [...s]).filter((b) => b.length >= 2);
    if (!bundles.length) bundles = [[...byType.keys()]];
  }
  const types = [...byType.keys()], t0 = Date.UTC(2026, 5, 1), events = [];
  for (let u = 1; u <= USERS; u++) {
    const uid = `U${String(u).padStart(4, '0')}`;
    const intents = sample(bundles, rand() < 0.3 ? 2 : 1).flatMap((b) => sample(b, Math.min(b.length, ri(2, 4))));
    if (rand() < 0.25) intents.push(pick(types));
    for (const type of intents) {
      const day = ri(0, 90) * 86400000, seen = new Set();
      for (let k = ri(2, 5); k > 0; k--) {
        let id = pickW(type); for (let r = 0; r < 4 && seen.has(id); r++) id = pickW(type);
        if (seen.has(id)) continue; seen.add(id);
        let ts = t0 + day + ri(0, 80000) * 1000;
        const ev = (event) => events.push({ user_id: uid, product_id: id, event, timestamp: new Date((ts += ri(20, 900) * 1000)).toISOString() });
        ev('view');
        if (rand() < 0.32) { ev('add_to_cart'); if (rand() < 0.6) ev('purchase'); }
      }
    }
  }
  fs.writeFileSync(eventsCsv, toCSV(events, ['user_id', 'product_id', 'event', 'timestamp']));
  const c = (e) => events.filter((x) => x.event === e).length;
  console.log(`✓ wrote ${events.length} interactions (${c('view')} views, ${c('add_to_cart')} add-to-cart, ${c('purchase')} purchases) from ${USERS} users`);
} else console.log('• data/raw/interactions.csv exists - keeping it');

// ---------- 3. evaluation queries + graded relevance judgments ----------
// Judgments come from the generator's hidden ground truth (product type / attributes / brand), NOT from the
// text the search engine indexes - so the evaluation is not circular.  2 = fully relevant, 1 = partially relevant.
if (synthetic) {
  const ids = products.map((p) => p.id);
  const qs = [];
  const rel = (fn) => { const o = {}; meta.forEach((m, i) => { const g = fn(m); if (g) o[ids[i]] = g; }); return o; };
  const typeNames = [...new Set(meta.map((m) => m.type))];
  const add = (kind, query, fn) => qs.push({ id: `q${qs.length + 1}`, kind, query, qrels: rel(fn) });
  for (const tn of sample(typeNames, 10)) add('category', tn.toLowerCase(), (m) => (m.type === tn ? 2 : 0));
  for (const tn of sample(typeNames, 8)) { const alt = meta.find((m) => m.type === tn).alt; add('synonym', alt.toLowerCase(), (m) => (m.type === tn ? 2 : 0)); }
  for (const tn of sample(typeNames, 12)) {
    const attr = pick(meta.find((m) => m.type === tn) && CATALOG.flatMap((c) => c.types).find((t) => t.name === tn).attrs);
    add('attribute', `${attr.toLowerCase()} ${tn.toLowerCase()}`, (m) => (m.type === tn ? (m.attrs.includes(attr) ? 2 : 1) : 0));
  }
  for (const tn of sample(typeNames, 8)) {
    const brand = pick([...new Set(meta.filter((m) => m.type === tn).map((m) => m.brand))]);
    add('brand', `${brand.toLowerCase()} ${tn.toLowerCase()}`, (m) => (m.type === tn ? (m.brand === brand ? 2 : 1) : 0));
  }
  for (const tn of sample(typeNames.filter((t) => !t.includes('-') && t.split(' ').some((w) => w.length >= 6)), 5)) {
    const w = tn.toLowerCase().split(' '), k = w.reduce((b, x, j) => (x.length > w[b].length ? j : b), 0), s = w[k];
    const at = ri(2, s.length - 2), typo = s.slice(0, at) + s.slice(at + 1); // drop one letter (never the first two)
    add('misspelled', w.map((x, j) => (j === k ? typo : x)).join(' '), (m) => (m.type === tn ? 2 : 0));
  }
  fs.writeFileSync(path.join(EVAL, 'queries.json'), JSON.stringify(qs));
  console.log(`✓ wrote ${qs.length} evaluation queries with judgments -> data/eval/queries.json`);
}
