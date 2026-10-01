'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { addToCart, cartQty } from '@/lib/cart';
import { onCart } from '@/lib/client-store';
import { CartIcon, CheckIcon, ArrowIcon } from './Icons';

export default function AddToCart({ id, className = '' }) {
  const router = useRouter(), { user } = useAuth();
  const [qty, setQty] = useState(0), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const uid = user?.id;
  useEffect(() => {
    if (!uid) { setQty(0); return; }
    let alive = true;
    const sync = () => cartQty(id).then((q) => alive && setQty(q)).catch(() => {});
    sync();
    const off = onCart(sync);
    return () => { alive = false; off(); };
  }, [id, uid]);

  const click = async () => {
    if (!uid) { router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
    setBusy(true); setErr('');
    try { await addToCart(id); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <button onClick={click} disabled={busy} className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition active:scale-[.97] disabled:opacity-60 ${qty ? 'bg-forest text-white' : 'bg-ink text-white hover:bg-accent'}`}>
        {qty ? <><CheckIcon /> In cart ({qty}) · add another</> : <><CartIcon /> {busy ? 'Adding...' : 'Add to cart'}</>}
      </button>
      {qty > 0 && <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">View cart <ArrowIcon width={16} height={16} /></Link>}
      {err && <p role="alert" className="w-full text-xs font-semibold text-accent">{err}</p>}
    </div>
  );
}
