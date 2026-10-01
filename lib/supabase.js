// Browser Supabase client (created lazily, so builds and server rendering never need the keys).
import { createBrowserClient } from '@supabase/ssr';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // old anon keys also work

export const isConfigured = () => Boolean(URL && KEY);

let client;
export function supabase() {
  if (!isConfigured()) throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  return (client ??= createBrowserClient(URL, KEY));
}
