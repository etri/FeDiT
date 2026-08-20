import { Suspense } from 'react';

import { Separator } from '@e8ight/ui/components/ui/separator';
import { ErrorBoundary } from '@suspensive/react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { contextKeys } from '@/apis/context';
import { ContextStructure } from '@/app/(app)/service/contexts/_components/ContextStructure';
import { ContextStructureSkeleton } from '@/app/(app)/service/contexts/_components/ContextStructureSkeleton';
import { PanelPlaceholder } from '@/components/common/PanelPlaceholder';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { getQueryClient } from '@/lib/get-query-client';
import { ndxproUpstream } from '@/lib/ndxpro-api';

async function fetchContextDetailServer(contextUrl: string): Promise<unknown> {
  const { baseUrl, token } = ndxproUpstream();

  const url = new URL(`${baseUrl}/manager/context`);
  url.searchParams.set('contextUrl', contextUrl);

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch context: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export default async function Page({
  params,
}: {
  params: Promise<{ contextId?: string[] }>;
}) {
  const { contextId: ctxSlug } = await params;
  const routeContextId = ctxSlug?.[0]
    ? decodeURIComponent(ctxSlug[0])
    : undefined;

  if (!routeContextId) {
    return (
      <PanelPlaceholder
        title="Context panel is ready"
        description="Select a context from the side panel to view its structure, or add a new one."
      />
    );
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: contextKeys.detail(routeContextId),
    queryFn: () => fetchContextDetailServer(routeContextId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 flex-col px-6 pt-4 pb-3">
          <h1 className="text-foreground text-xl font-semibold">
            Context Manage
          </h1>
        </header>
        <Separator />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-6 pt-4 pb-6">
          <ErrorBoundary fallback={<QueryErrorFallback />}>
            <Suspense fallback={<ContextStructureSkeleton />}>
              <ContextStructure />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </HydrationBoundary>
  );
}
