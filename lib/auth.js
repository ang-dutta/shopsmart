// Authentication with Supabase Auth (email + password). Same function names as the old demo version.
import { supabase } from './supabase.js';

export const toUser = (u) => (u ? { id: u.id, email: u.email, name: u.user_metadata?.name || (u.email ?? '').split('@')[0] } : null);

export function validateSignup({ name, email, password }) {
  name = String(name ?? '').trim(); email = String(email ?? '').trim().toLowerCase(); password = String(password ?? '');
  if (name.length < 2) throw new Error('Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  return { name, email, password };
}

const friendly = (err) => {
  const m = err?.message ?? 'Something went wrong.';
  if (/invalid login credentials/i.test(m)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(m)) return 'Please confirm your email first. Check your inbox for the link.';
  if (/already registered/i.test(m)) return 'An account with this email already exists. Try signing in.';
  if (/rate limit/i.test(m)) return 'Too many attempts. Please wait a few minutes and try again.';
  return m;
};

/** Returns { needsConfirmation }. With "Confirm email" switched off in Supabase, the user is signed in straight away. */
export async function register(form) {
  const { name, email, password } = validateSignup(form);
  const { data, error } = await supabase().auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: `${window.location.origin}/login` } });
  if (error) throw new Error(friendly(error));
  if (data.user && data.user.identities?.length === 0) throw new Error('An account with this email already exists. Try signing in.');
  return { needsConfirmation: !data.session };
}

export async function login({ email, password }) {
  const { error } = await supabase().auth.signInWithPassword({ email: String(email ?? '').trim().toLowerCase(), password: String(password ?? '') });
  if (error) throw new Error(friendly(error));
}

export const logout = () => supabase().auth.signOut();
