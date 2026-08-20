import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { attributeKeys } from '@/apis/attribute';
import { AttributeDetailView } from '@/app/(app)/service/attributes/_components/AttributeDetail';
import { getQueryClient } from '@/lib/get-query-client';
import { ndxproUpstream } from '@/lib/ndxpro-api';

async function fetchAttributeDetailServer(id: string): Promise<unknown> {
  const { baseUrl, token } = ndxproUpstream();

  const res = await fetch(
    `${baseUrl}/manager/attributes/${encodeURIComponent(id)}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch attribute: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

export default async function Page({
  params,
}: {
  params: Promise<{ attrId: string }>;
}) {
  const { attrId: rawAttrId } = await params;
  const attrId = decodeURIComponent(rawAttrId);

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: attributeKeys.detail(attrId),
    queryFn: () => fetchAttributeDetailServer(attrId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AttributeDetailView />
    </HydrationBoundary>
  );
}
