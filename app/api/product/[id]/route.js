import { NextResponse } from 'next/server';
import { getData } from '@/lib/data';
import { similarTo, alsoBoughtFor } from '@/lib/reco/recommend';

export async function GET(_req, { params }) {
  const { id } = await params, data = getData(), pos = data.idToPos.get(id);
  if (pos === undefined) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ product: data.products[pos], similar: similarTo(data, id, 8), alsoBought: alsoBoughtFor(data, id, 8) });
}
