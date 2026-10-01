import { NextResponse } from 'next/server';
import { getEvaluation } from '@/lib/eval/cache';

export function GET() { return NextResponse.json(getEvaluation()); }
