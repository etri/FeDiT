import { requireSessionCookies } from '@/lib/auth-cookies';
import { ndxproUpstream } from '@/lib/ndxpro-api';
import { proxyToUpstream } from '@/lib/proxy-to-upstream';

import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, { params }: RouteParams) {
  const unauthorized = await requireSessionCookies();
  if (unauthorized) return unauthorized;

  const { path } = await params;
  const { baseUrl, token } = ndxproUpstream();
  return proxyToUpstream(request, baseUrl, path, token);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
