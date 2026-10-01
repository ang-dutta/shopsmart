'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { addToCart, cartQty, onStore } from '@/lib/client-store';
import { CartIcon, CheckIcon, ArrowIcon } from './Icons';

export default function AddToCart({ id, className = '' }) {
  const router = useRouter();
  const [qty, setQty] = useState(0);
  useEffect(() => { const sync = () => setQty(getUser() ? cartQty(id) : 0); sync(); return onStore(sync); }, [id]);

  const click = () => {
    if (!getUser()) { router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
    addToCart(id);
  };
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <button onClick={click} className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition active:scale-[.97] ${qty ? 'bg-forest text-white' : 'bg-ink text-white hover:bg-accent'}`}>
        {qty ? <><CheckIcon /> In cart ({qty}) · add another</> : <><CartIcon /> Add to cart</>}
      </button>
      {qty > 0 && <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">View cart <ArrowIcon width={16} height={16} /></Link>}
    </div>
  );
}
