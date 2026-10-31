import { NextRequest, NextResponse } from 'next/server';
import { GET as getOrderByParam } from '../route';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolved = await Promise.resolve(params);
  const url = new URL(request.url);
  url.searchParams.set('id', resolved.id);
  const newReq = new NextRequest(url, request);
  return getOrderByParam(newReq);
}
