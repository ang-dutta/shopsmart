'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, register } from '@/lib/auth';
import { useAuth } from '@/lib/useAuth';
import { isConfigured } from '@/lib/supabase';

export default function LoginForm() {
  const router = useRouter(), sp = useSearchParams();
  const next = (() => { const n = sp.get('next') || '/cart'; return n.startsWith('/') && !n.startsWith('//') ? n : '/cart'; })();
  const [mode, setMode] = useState(sp.get('mode') === 'register' ? 'register' : 'login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(''), [info, setInfo] = useState(''), [busy, setBusy] = useState(false), [show, setShow] = useState(false);
  const { user } = useAuth(), configured = isConfigured();
  useEffect(() => { if (user) router.replace(next); }, [user, next, router]);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'register') {
        const r = await register(f);
        if (r.needsConfirmation) { setInfo('Account created. Check your email and click the confirmation link, then sign in.'); setMode('login'); setBusy(false); return; }
      } else await login(f);
      router.push(next);
    } catch (x) { setErr(x.message || 'Something went wrong.'); setBusy(false); }
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
        {info && <p role="status" className="rounded-2xl bg-forest-soft px-4 py-2.5 text-sm font-semibold text-forest">{info}</p>}
        {err && <p role="alert" className="rounded-2xl bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent">{err}</p>}
        <button disabled={busy || !configured} className="w-full rounded-full bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-accent disabled:opacity-60">{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      {!configured && <p role="alert" className="mt-5 rounded-2xl bg-accent-soft px-4 py-3 text-xs leading-relaxed text-accent">Login is not configured yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to <code>.env.local</code> (and to Vercel), then restart.</p>}
    </div>
  );
}
