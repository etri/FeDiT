import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { entityKeys } from '@/apis/entity';
import EntityDetailWrapper from '@/app/(app)/service/entities/_components/EntityDetailWrapper';
import { getQueryClient } from '@/lib/get-query-client';
import { ndxproUpstream } from '@/lib/ndxpro-api';

async function fetchEntityDetailServer(
  contextId: string,
  entityId: string,
): Promise<unknown> {
  const { baseUrl, token } = ndxproUpstream();

  const res = await fetch(
    `${baseUrl}/service/entities/${encodeURIComponent(entityId)}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Link: `<${contextId}>`,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch entity: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const contextId = slug?.[0] ? decodeURIComponent(slug[0]) : undefined;
  const modelId = slug?.[1];
  const entityId = slug?.[2] ? decodeURIComponent(slug[2]) : undefined;

  const queryClient = getQueryClient();
  if (contextId && modelId && entityId) {
    void queryClient.prefetchQuery({
      queryKey: entityKeys.detail(`<${contextId}>`, entityId),
      queryFn: () => fetchEntityDetailServer(contextId, entityId),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EntityDetailWrapper />
    </HydrationBoundary>
  );
}
