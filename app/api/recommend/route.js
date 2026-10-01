import { NextResponse } from 'next/server';
import { getData } from '@/lib/data';
import { forYou } from '@/lib/reco/recommend';

// POST { viewed: ["P00012", ...], cart: ["P00033"] }  (ids come from the browser's localStorage)
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const ids = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, 30) : []);
  return NextResponse.json(forYou(getData(), ids(body.viewed), ids(body.cart), 12));
}
