export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'USD';
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 });
const fmt0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
export const money = (n) => (Number.isInteger(n) ? fmt0.format(n) : fmt.format(n));

// Decorative emoji + hue for category tiles (falls back gracefully for custom CSV categories).
export const CATEGORY_STYLE = {
  Electronics: ['🎧', 215], Fashion: ['👟', 340], 'Home & Kitchen': ['☕', 30], 'Sports & Outdoors': ['⛺', 150],
  'Beauty & Care': ['🌸', 300], 'Toys & Games': ['🧩', 45], Office: ['🖥️', 260],
};
export const categoryStyle = (name) => CATEGORY_STYLE[name] ?? ['🛍️', [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)];
