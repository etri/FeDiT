import { proxyToBff } from '@/lib/proxy-to-bff';
import { NOTICES_TAG } from '@/lib/revalidation-tags';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return proxyToBff(request, {
    path: '/notices',
    searchParams: request.nextUrl.searchParams,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBff(request, {
    path: '/notices',
    body,
    invalidateTags: [NOTICES_TAG],
  });
}
