'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser, login, register } from '@/lib/auth';

export default function LoginForm() {
  const router = useRouter(), sp = useSearchParams();
  const next = (() => { const n = sp.get('next') || '/cart'; return n.startsWith('/') && !n.startsWith('//') ? n : '/cart'; })();
  const [mode, setMode] = useState(sp.get('mode') === 'register' ? 'register' : 'login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false), [show, setShow] = useState(false);
  useEffect(() => { if (getUser()) router.replace(next); }, [next, router]);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { mode === 'register' ? await register(f) : await login(f); router.push(next); }
    catch (x) { setErr(x.message || 'Something went wrong.'); setBusy(false); }
  };
  const input = 'w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-ink';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 inline-flex rounded-full border border-line bg-white p-1" role="tablist">
        {[['login', 'Sign in'], ['register', 'Create account']].map(([m, l]) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr(''); }} className={`rounded-full px-5 py-2 text-sm font-bold transition ${mode === m ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
        ))}
      </div>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">{mode === 'login' ? <>Welcome <span className="italic text-accent">back</span>.</> : <>Join <span className="italic text-accent">ShopSmart</span>.</>}</h1>
      <p className="mt-2 text-sm text-muted">{mode === 'login' ? 'Sign in to add items and see your cart.' : 'Create an account to save a cart and get personalised picks.'}</p>
      <form onSubmit={submit} className="mt-6 space-y-3" noValidate>
        {mode === 'register' && <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-[.12em] text-muted">Name</span><input className={input} value={f.name} onChange={set('name')} autoComplete="name" placeholder="Angela" /></label>}
        <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-[.12em] text-muted">Email</span><input className={input} type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" /></label>
        <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-[.12em] text-muted">Password</span>
          <span className="relative block"><input className={input + ' pr-16'} type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 6 characters" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted hover:text-ink">{show ? 'Hide' : 'Show'}</button></span></label>
        {err && <p role="alert" className="rounded-2xl bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent">{err}</p>}
        <button disabled={busy} className="w-full rounded-full bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-accent disabled:opacity-60">{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="mt-5 rounded-2xl bg-forest-soft px-4 py-3 text-xs leading-relaxed text-forest">Demo login: accounts are stored only in this browser (passwords are hashed with PBKDF2), so they are not shared between devices. Swap <code>lib/auth.js</code> for a real auth provider to go beyond a course project.</p>
    </div>
  );
}
