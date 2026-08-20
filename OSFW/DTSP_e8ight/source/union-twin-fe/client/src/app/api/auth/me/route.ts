import { proxyToBff } from '@/lib/proxy-to-bff';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return proxyToBff(request, { path: '/auth/me' });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return proxyToBff(request, { path: '/auth/me', body });
}
