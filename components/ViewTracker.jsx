'use client';
import { useEffect } from 'react';
import { pushViewed } from '@/lib/client-store';

// Records a product view in localStorage (this is the only "user profile" ShopSmart keeps; it never leaves the browser
// except as a list of ids sent to /api/recommend).
export default function ViewTracker({ id }) {
  useEffect(() => { pushViewed(id); }, [id]);
  return null;
}
