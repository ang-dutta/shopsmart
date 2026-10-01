import { NextResponse } from 'next/server';
import { getData } from '@/lib/data';

// GET /api/products?ids=P00001,P00002  -> products in the requested order (used by the cart page)
export function GET(req) {
  const data = getData(), ids = (new URL(req.url).searchParams.get('ids') ?? '').split(',').filter(Boolean).slice(0, 50);
  return NextResponse.json({ products: ids.map((id) => data.products[data.idToPos.get(id)]).filter(Boolean) });
}
