'use client';
import { useEffect, useState } from 'react';
import ProductGrid from './ProductGrid';
import { getViewed } from '@/lib/client-store';
import { getCartIds } from '@/lib/cart';
import { useAuth } from '@/lib/useAuth';

export default function Recommended({ title = 'Recommended for you', hintWhenEmpty = true, exclude }) {
  const [state, setState] = useState({ loading: true, items: [], personalised: false });
  const { user, ready } = useAuth(), uid = user?.id;
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const load = async () => {
      const viewed = getViewed().filter((id) => id !== exclude);
      try {
        const cart = uid ? await getCartIds().catch(() => []) : [];
        const r = await fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ viewed, cart }) });
        const j = await r.json();
        if (alive) setState({ loading: false, items: j.items, personalised: j.personalised });
      } catch { if (alive) setState((s) => ({ ...s, loading: false })); }
    };
    load();
    return () => { alive = false; };
  }, [exclude, ready, uid]);

  if (!state.loading && !state.items.length) return null;
  return (
    <section className="mt-16">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
        <p className="text-sm text-muted">
          {state.personalised ? 'Based on the products you viewed. Hybrid content + collaborative filtering.' : hintWhenEmpty ? 'Browse a few products and this row learns your taste. Showing what’s trending for now.' : ''}
        </p>
      </div>
      {state.loading ? <div className="flex gap-4 overflow-hidden">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-72 w-[250px] shrink-0" />)}</div> : <ProductGrid items={state.items} rail />}
    </section>
  );
}
