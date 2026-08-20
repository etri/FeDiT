import { Suspense } from 'react';

import { ErrorBoundary } from '@suspensive/react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { modelKeys } from '@/apis/model';
import DataModelDetail from '@/app/(app)/service/models/_components/dataModelDetail/DataModelDetail';
import DataModelDetailSkeleton from '@/app/(app)/service/models/_components/DataModelDetailSkeleton';
import { PanelPlaceholder } from '@/components/common/PanelPlaceholder';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { getQueryClient } from '@/lib/get-query-client';
import { ndxproUpstream } from '@/lib/ndxpro-api';

async function fetchDataModelServer(modelId: string): Promise<unknown> {
  const { baseUrl, token } = ndxproUpstream();

  const res = await fetch(
    `${baseUrl}/manager/data-models/${encodeURIComponent(modelId)}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch data model: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

export default async function Page({
  params,
}: {
  params: Promise<{ modelId?: string[] }>;
}) {
  const { modelId: modelSlug } = await params;
  const modelId = modelSlug?.[0] ? decodeURIComponent(modelSlug[0]) : undefined;

  if (!modelId) {
    return (
      <PanelPlaceholder
        title="Data Model panel is ready"
        description="Select a data model from the side panel to view its details, or create a new one."
      />
    );
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: modelKeys.detail(modelId),
    queryFn: () => fetchDataModelServer(modelId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<QueryErrorFallback />}>
        <Suspense fallback={<DataModelDetailSkeleton />}>
          <DataModelDetail />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
