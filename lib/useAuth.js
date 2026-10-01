import { useEffect, useState } from 'react';
import { supabase, isConfigured } from './supabase.js';
import { toUser } from './auth.js';

/** { user, ready }: `ready` becomes true once the saved session (if any) has been read. */
export function useAuth() {
  const [state, set] = useState({ user: null, ready: false });
  useEffect(() => {
    if (!isConfigured()) { set({ user: null, ready: true }); return; }
    const sb = supabase();
    const { data } = sb.auth.onAuthStateChange((_event, session) => set({ user: toUser(session?.user), ready: true })); // keep this callback synchronous
    sb.auth.getSession().then(({ data: d }) => set((s) => (s.ready ? s : { user: toUser(d.session?.user), ready: true })));
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}
