import { NextResponse } from 'next/server';
import { getData } from '@/lib/data';
import { search } from '@/lib/ir/search';
import { parseSearchParams } from '@/lib/params';

// GET /api/search?q=wireless+headphones&model=bm25&category=Electronics&min=20&max=200&rating=4&sort=price_asc&page=1
export function GET(req) {
  const p = parseSearchParams(new URL(req.url).searchParams);
  return NextResponse.json(search(getData(), { q: p.q, model: p.model, expand: p.expand, exact: p.exact, filters: p.filters, sort: p.sort, page: p.page, pageSize: 24 }));
}
