import { proxyToBff } from '@/lib/proxy-to-bff';

import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyToBff(request, {
    path: '/auth/me/deletion-request',
    body,
  });
}
