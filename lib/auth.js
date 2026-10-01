// Demo authentication that runs entirely in the browser (no server, no database).
// Accounts live in this browser's localStorage; passwords are never stored in plain text
// (PBKDF2-SHA256, 100k iterations, random salt). For a real product, replace this file with a
// server-side auth provider (e.g. Supabase Auth, Firebase Auth or NextAuth) and keep the same function names.
const USERS = 'shopsmart:users', SESSION = 'shopsmart:session';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const notify = () => { try { window.dispatchEvent(new Event('shopsmart:store')); } catch {} };
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

async function hash(password, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256));
}

export const getSessionEmail = () => read(SESSION, null);

export function getUser() {
  const email = getSessionEmail();
  const u = email && read(USERS, {})[email];
  return u ? { email, name: u.name } : null;
}

export async function register({ name, email, password }) {
  name = String(name ?? '').trim(); email = String(email ?? '').trim().toLowerCase();
  if (name.length < 2) throw new Error('Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (String(password ?? '').length < 6) throw new Error('Password must be at least 6 characters.');
  const users = read(USERS, {});
  if (users[email]) throw new Error('An account with this email already exists. Try signing in.');
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  users[email] = { name, salt, hash: await hash(password, salt) };
  write(USERS, users); write(SESSION, email); notify();
  return { email, name };
}

export async function login({ email, password }) {
  email = String(email ?? '').trim().toLowerCase();
  const u = read(USERS, {})[email];
  if (!u || (await hash(String(password ?? ''), u.salt)) !== u.hash) throw new Error('Incorrect email or password.');
  write(SESSION, email); notify();
  return { email, name: u.name };
}

export function logout() { localStorage.removeItem(SESSION); notify(); }
