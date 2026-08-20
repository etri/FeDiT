import { proxyToBff } from '@/lib/proxy-to-bff';
import { NOTICES_TAG } from '@/lib/revalidation-tags';

import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBff(request, {
    path: `/notices/${id}/publish`,
    invalidateTags: [NOTICES_TAG],
  });
}
