// Tiny localStorage layer for things that belong to the browser: viewed products (drives "Recommended for you")
// and recent searches. The cart lives in Supabase (see lib/cart.js).
const K = { viewed: 'shopsmart:viewed', recent: 'shopsmart:recent' };
const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); window.dispatchEvent(new Event('shopsmart:store')); } catch {} };

export const getViewed = () => read(K.viewed);
export const pushViewed = (id) => write(K.viewed, [id, ...read(K.viewed).filter((x) => x !== id)].slice(0, 30));
export const getRecent = () => read(K.recent);
export const pushRecent = (q) => write(K.recent, [q, ...read(K.recent).filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6));
export const clearRecent = () => write(K.recent, []);
export const onStore = (fn) => { window.addEventListener('shopsmart:store', fn); return () => window.removeEventListener('shopsmart:store', fn); };
export const onCart = (fn) => { window.addEventListener('shopsmart:cart', fn); return () => window.removeEventListener('shopsmart:cart', fn); };
