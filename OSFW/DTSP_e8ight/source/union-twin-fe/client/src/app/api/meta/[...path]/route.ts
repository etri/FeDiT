import { requireSessionCookies } from '@/lib/auth-cookies';
import { proxyToUpstream } from '@/lib/proxy-to-upstream';

import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, { params }: RouteParams) {
  const unauthorized = await requireSessionCookies();
  if (unauthorized) return unauthorized;

  const { path } = await params;
  return proxyToUpstream(
    request,
    process.env.DTMETA_API_URL,
    ['meta', ...path],
    process.env.DTMETA_TOKEN,
  );
}

export { handler as GET, handler as PUT };
