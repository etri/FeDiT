import { proxyToBff } from '@/lib/proxy-to-bff';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return proxyToBff(request, {
    path: '/users',
    searchParams: request.nextUrl.searchParams,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBff(request, {
    path: '/users',
    body,
  });
}
