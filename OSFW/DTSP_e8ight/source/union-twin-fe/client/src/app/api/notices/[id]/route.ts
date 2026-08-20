import { proxyToBff } from '@/lib/proxy-to-bff';
import { NOTICES_TAG } from '@/lib/revalidation-tags';

import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBff(request, { path: `/notices/${id}` });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  return proxyToBff(request, {
    path: `/notices/${id}`,
    body,
    invalidateTags: [NOTICES_TAG],
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBff(request, {
    path: `/notices/${id}`,
    invalidateTags: [NOTICES_TAG],
  });
}
