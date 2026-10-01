// Per-user cart stored in the Supabase table public.cart_items.
// Row level security guarantees every query only sees the signed-in user's own rows.
import { supabase } from './supabase.js';

const notify = () => { try { window.dispatchEvent(new Event('shopsmart:cart')); } catch {} };
const uid = async () => (await supabase().auth.getSession()).data.session?.user?.id ?? null;
const check = ({ error }) => { if (error) throw new Error(error.message); };
const clamp = (q) => Math.max(1, Math.min(q, 20));

export async function getCartItems() {
  const { data, error } = await supabase().from('cart_items').select('product_id, qty').order('updated_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.product_id, qty: r.qty }));
}
export const getCartIds = async () => (await getCartItems()).map((l) => l.id);
export const cartCount = async () => (await getCartItems()).reduce((s, l) => s + l.qty, 0);

export async function cartQty(id) {
  const { data, error } = await supabase().from('cart_items').select('qty').eq('product_id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.qty ?? 0;
}
export async function addToCart(id) {
  const user_id = await uid();
  if (!user_id) throw new Error('Please sign in first.');
  const qty = clamp((await cartQty(id)) + 1);
  check(await supabase().from('cart_items').upsert({ user_id, product_id: id, qty }, { onConflict: 'user_id,product_id' }));
  notify();
}
export async function setQty(id, qty) { check(await supabase().from('cart_items').update({ qty: clamp(qty) }).eq('product_id', id)); notify(); }
export async function removeFromCart(id) { check(await supabase().from('cart_items').delete().eq('product_id', id)); notify(); }
export async function clearCart() {
  const user_id = await uid();
  if (user_id) { check(await supabase().from('cart_items').delete().eq('user_id', user_id)); notify(); }
}
