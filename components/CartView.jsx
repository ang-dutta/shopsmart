'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductImage from './ProductImage';
import Recommended from './Recommended';
import { ArrowIcon, CartIcon, MinusIcon, PlusIcon, TrashIcon, CheckIcon } from './Icons';
import { useAuth } from '@/lib/useAuth';
import { clearCart, getCartItems, removeFromCart, setQty } from '@/lib/cart';
import { onCart } from '@/lib/client-store';
import { money } from '@/lib/format';

export default function CartView() {
  const { user, ready: authReady } = useAuth(), uid = user?.id;
  const [loaded, setLoaded] = useState(false), [lines, setLines] = useState([]), [products, setProducts] = useState({}), [order, setOrder] = useState(null), [err, setErr] = useState('');
  const load = () => getCartItems().then((l) => { setLines(l); setErr(''); setLoaded(true); }).catch((e) => { setErr(e.message); setLoaded(true); });
  useEffect(() => {
    if (!uid) { setLines([]); setLoaded(true); return; }
    load();
    return onCart(load);
  }, [uid]);
  const key = lines.map((l) => l.id).join(',');
  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetch('/api/products?ids=' + key).then((r) => r.json()).then((j) => alive && setProducts(Object.fromEntries(j.products.map((p) => [p.id, p])))).catch(() => {});
    return () => { alive = false; };
  }, [key]);
  const ready = authReady && loaded;
  const change = (id, qty) => { setLines((ls) => ls.map((l) => (l.id === id ? { ...l, qty } : l))); setQty(id, qty).catch((e) => { setErr(e.message); load(); }); };
  const remove = (id) => { setLines((ls) => ls.filter((l) => l.id !== id)); removeFromCart(id).catch((e) => { setErr(e.message); load(); }); };

  if (!ready) return <div className="skeleton h-80" />;

  if (!user) return (
    <div className="mx-auto max-w-lg rounded-card border border-line bg-white p-10 text-center shadow-soft">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent"><CartIcon width={26} height={26} /></span>
      <h1 className="mt-5 font-display text-4xl">Sign in to see your cart</h1>
      <p className="mt-2 text-sm text-muted">Carts belong to an account, so your items are waiting for you when you come back.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/login?next=/cart" className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-accent">Sign in</Link>
        <Link href="/login?next=/cart&mode=register" className="rounded-full border border-line px-6 py-3 text-sm font-bold transition hover:border-ink">Create account</Link>
      </div>
    </div>
  );

  if (order) return (
    <div className="mx-auto max-w-lg rounded-card border border-line bg-white p-10 text-center shadow-soft">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest-soft text-forest"><CheckIcon width={26} height={26} /></span>
      <h1 className="mt-5 font-display text-4xl">Order placed</h1>
      <p className="mt-2 text-sm text-muted">Thanks, {user.name.split(' ')[0]}. Order <b className="font-mono text-ink">{order.id}</b> for {order.count} item{order.count > 1 ? 's' : ''} ({money(order.total)}) is confirmed. This is a demo checkout, so nothing was charged.</p>
      <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-accent">Keep shopping <ArrowIcon width={16} height={16} /></Link>
    </div>
  );

  if (!lines.length) return (
    <div className="mx-auto max-w-lg rounded-card border border-dashed border-line bg-white/60 p-10 text-center">
      <h1 className="font-display text-4xl">Your cart is empty</h1>
      <p className="mt-2 text-sm text-muted">Hi {user.name.split(' ')[0]}, add something you like and it will show up here.</p>
      <Link href="/search" className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-accent">Browse products <ArrowIcon width={16} height={16} /></Link>
      <Recommended title="Popular right now" hintWhenEmpty={false} />
    </div>
  );

  const total = lines.reduce((s, l) => s + (products[l.id]?.price ?? 0) * l.qty, 0), count = lines.reduce((s, l) => s + l.qty, 0);
  const allLoaded = lines.every((l) => products[l.id]);
  const checkout = () => { setOrder({ id: 'SS-' + Date.now().toString(36).toUpperCase(), total, count }); clearCart().catch((e) => setErr(e.message)); };

  return (
    <>
      <h1 className="font-display text-4xl sm:text-5xl">Your cart <span className="text-muted">({count})</span></h1>
      {err && <p role="alert" className="mt-4 rounded-2xl bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent">Cart problem: {err}</p>}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-3">
          {lines.map((l) => {
            const p = products[l.id];
            return (
              <li key={l.id} className="fade-up flex gap-4 rounded-card border border-line bg-white p-3 shadow-soft sm:p-4">
                {p ? (
                  <>
                    <Link href={`/product/${p.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-paper sm:h-28 sm:w-28"><ProductImage src={p.image} alt={p.title} /></Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">{p.brand}</p>
                      <Link href={`/product/${p.id}`} className="line-clamp-2 font-semibold leading-snug hover:text-accent">{p.title}</Link>
                      <p className="text-sm text-muted">{money(p.price)} each</p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                        <div className="inline-flex items-center rounded-full border border-line">
                          <button onClick={() => change(l.id, l.qty - 1)} disabled={l.qty <= 1} aria-label="Decrease quantity" className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-paper disabled:opacity-30"><MinusIcon width={16} height={16} /></button>
                          <span className="w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">{l.qty}</span>
                          <button onClick={() => change(l.id, l.qty + 1)} disabled={l.qty >= 20} aria-label="Increase quantity" className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-paper disabled:opacity-30"><PlusIcon width={16} height={16} /></button>
                        </div>
                        <span className="text-lg font-bold tracking-tight">{money(Math.round(p.price * l.qty * 100) / 100)}</span>
                        <button onClick={() => remove(l.id)} aria-label={`Remove ${p.title}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-accent"><TrashIcon width={15} height={15} /> Remove</button>
                      </div>
                    </div>
                  </>
                ) : <div className="skeleton h-28 w-full" />}
              </li>
            );
          })}
        </ul>
        <aside className="h-fit rounded-card border border-line bg-white p-6 shadow-soft lg:sticky lg:top-24">
          <h2 className="font-display text-2xl">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Items ({count})</dt><dd className="font-semibold">{money(Math.round(total * 100) / 100)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="font-semibold text-forest">Free</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-bold">{money(Math.round(total * 100) / 100)}</dd></div>
          </dl>
          <button onClick={checkout} disabled={!allLoaded} className="mt-5 w-full rounded-full bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-accent disabled:opacity-50">Checkout (demo)</button>
          <button onClick={() => clearCart().catch((e) => setErr(e.message))} className="mt-2 w-full rounded-full py-2.5 text-xs font-semibold text-muted transition hover:text-accent">Empty cart</button>
        </aside>
      </div>
      <Recommended title="You may also like" hintWhenEmpty={false} />
    </>
  );
}
