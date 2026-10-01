'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import SearchBox from './SearchBox';
import { CartIcon, UserIcon } from './Icons';
import { logout } from '@/lib/auth';
import { useAuth } from '@/lib/useAuth';
import { cartCount } from '@/lib/cart';
import { onCart } from '@/lib/client-store';

export default function Header() {
  const path = usePathname(), router = useRouter();
  const { user, ready } = useAuth();
  const [count, setCount] = useState(0), [menu, setMenu] = useState(false);
  const uid = user?.id;
  const menuRef = useRef(null);
  useEffect(() => {
    if (!uid) { setCount(0); return; }
    let alive = true;
    const s = () => cartCount().then((c) => alive && setCount(c)).catch(() => {});
    s();
    const off = onCart(s);
    return () => { alive = false; off(); };
  }, [uid]);
  useEffect(() => {
    const h = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => setMenu(false), [path]);
  const link = (href, label) => (
    <Link href={href} className={`rounded-full px-3 py-1.5 text-sm font-semibold transition hover:bg-ink/5 ${path === href ? 'text-ink' : 'text-muted'}`}>{label}</Link>
  );
  const onSearchHidden = path === '/' || path === '/login';
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3 sm:gap-6 sm:px-8">
        <Link href="/" className="group flex shrink-0 items-baseline gap-0.5 font-display text-2xl leading-none tracking-tight">
          shop<span className="italic text-accent">smart</span><span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-accent transition group-hover:scale-150" />
        </Link>
        <div className="hidden min-w-0 flex-1 md:block">{!onSearchHidden && <div className="mx-auto max-w-xl"><SearchBox /></div>}</div>
        <nav className="ml-auto flex items-center gap-1">
          <span className="hidden sm:contents">{link('/search', 'Browse')}{link('/evaluation', 'Evaluation')}</span>
          <Link href="/cart" className="relative ml-1 grid h-10 w-10 place-items-center rounded-full border border-line bg-white transition hover:border-ink" title="Your cart" aria-label={`Cart, ${count} items`}>
            <CartIcon />
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{count}</span>}
          </Link>
          {user ? (
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu"
                className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-bold uppercase text-white transition hover:bg-accent">{user.name[0]}</button>
              {menu && (
                <div role="menu" className="pop-in absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-lift">
                  <div className="px-3 py-2"><p className="truncate text-sm font-bold">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p></div>
                  <Link href="/cart" role="menuitem" className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-paper">My cart {count > 0 && `(${count})`}</Link>
                  <button role="menuitem" onClick={async () => { await logout(); setMenu(false); router.push('/'); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-accent hover:bg-accent-soft">Sign out</button>
                </div>
              )}
            </div>
          ) : !ready ? (
            <span className="ml-1 h-10 w-10 rounded-full skeleton" aria-hidden />
          ) : (
            <Link href={`/login?next=${encodeURIComponent(path)}`} className="ml-1 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"><UserIcon width={16} height={16} /> <span className="hidden sm:inline">Sign in</span></Link>
          )}
        </nav>
      </div>
      {!onSearchHidden && <div className="px-5 pb-3 md:hidden"><SearchBox /></div>}
    </header>
  );
}
