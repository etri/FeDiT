import { proxyToBff } from '@/lib/proxy-to-bff';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return proxyToBff(request, { path: '/roles' });
}
