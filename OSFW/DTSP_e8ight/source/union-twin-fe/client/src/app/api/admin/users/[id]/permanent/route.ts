import { proxyToBff } from '@/lib/proxy-to-bff';

import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBff(request, {
    path: `/users/${id}/permanent`,
  });
}
