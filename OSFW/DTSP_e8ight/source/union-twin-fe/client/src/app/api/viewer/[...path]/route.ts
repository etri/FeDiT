import { requireSessionCookies } from '@/lib/auth-cookies';
import { proxyToUpstream } from '@/lib/proxy-to-upstream';

import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, { params }: RouteParams) {
  const unauthorized = await requireSessionCookies();
  if (unauthorized) return unauthorized;

  const { path } = await params;
  return proxyToUpstream(request, process.env.VIEWER_URL, ['api', ...path]);
}

export { handler as GET, handler as POST };
