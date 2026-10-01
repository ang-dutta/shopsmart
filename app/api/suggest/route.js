import { NextResponse } from 'next/server';
import { getData } from '@/lib/data';
import { suggest } from '@/lib/ir/suggest';

export function GET(req) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  return NextResponse.json(suggest(getData(), q.slice(0, 80)), { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
}
