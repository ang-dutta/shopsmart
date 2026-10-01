// Tiny localStorage layer: viewed products (drives "Recommended for you"), per-user cart, recent searches.
import { getSessionEmail } from './auth.js';

const K = { viewed: 'shopsmart:viewed', recent: 'shopsmart:recent' };
const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); window.dispatchEvent(new Event('shopsmart:store')); } catch {} };

export const getViewed = () => read(K.viewed);
export const pushViewed = (id) => write(K.viewed, [id, ...read(K.viewed).filter((x) => x !== id)].slice(0, 30));
export const getRecent = () => read(K.recent);
export const pushRecent = (q) => write(K.recent, [q, ...read(K.recent).filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6));
export const clearRecent = () => write(K.recent, []);
export const onStore = (fn) => { window.addEventListener('shopsmart:store', fn); return () => window.removeEventListener('shopsmart:store', fn); };

// ---- cart: one cart per signed-in user, stored as [{ id, qty }] ----
const cartKey = () => { const e = getSessionEmail(); return e ? `shopsmart:cart:${e}` : null; };
export const getCartItems = () => { const k = cartKey(); return k ? read(k) : []; };
const saveCart = (items) => { const k = cartKey(); if (k) write(k, items); };
export const getCart = () => getCartItems().map((l) => l.id);
export const cartCount = () => getCartItems().reduce((s, l) => s + l.qty, 0);
export const cartQty = (id) => getCartItems().find((l) => l.id === id)?.qty ?? 0;
export const addToCart = (id) => { const c = getCartItems(), l = c.find((x) => x.id === id); l ? (l.qty = Math.min(l.qty + 1, 20)) : c.push({ id, qty: 1 }); saveCart(c); };
export const setQty = (id, qty) => saveCart(getCartItems().map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(qty, 20)) } : l)));
export const removeFromCart = (id) => saveCart(getCartItems().filter((l) => l.id !== id));
export const clearCart = () => saveCart([]);
