'use client';

import type { ReactNode } from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { useIsMobile } from '@e8ight/ui/hooks';
import { ErrorBoundary, Suspense } from '@suspensive/react';

import TreeHistoryProvider from '@/app/(app)/service/entities/_components/contexts/TreeHistoryProvider';
import EntityContextList from '@/app/(app)/service/entities/_components/EntityContextList';
import { EntityContextListSkeleton } from '@/app/(app)/service/entities/_components/EntityContextListSkeleton';
import EntitySelector from '@/app/(app)/service/entities/_components/EntitySelector';
import { EntityTableSkeleton } from '@/app/(app)/service/entities/_components/EntityTableSkeleton';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import useEntityTabList from '@/app/(app)/service/entities/_hooks/useEntityTabList';
import { useSyncEntityRouteWithTabs } from '@/app/(app)/service/entities/_hooks/useSyncEntityRouteWithTabs';
import { NavigationAside } from '@/components/common/NavigationAside';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <TreeHistoryProvider>
      <EntityWorkspace>{children}</EntityWorkspace>
    </TreeHistoryProvider>
  );
}

function EntityWorkspace({ children }: { children: ReactNode }) {
  const [, entityTabListAction] = useEntityTabList();
  useSyncEntityRouteWithTabs();
  const { contextId, modelId } = useEntityParams();
  const isMobile = useIsMobile();

  const shouldShowBrowserPanel = Boolean(contextId) && Boolean(modelId);

  return (
    <ResizablePanelGroup
      direction={isMobile ? 'vertical' : 'horizontal'}
      className="bg-background h-full min-h-0 w-full"
    >
      <ResizablePanel
        defaultSize={18}
        minSize={12}
        maxSize={28}
        className="flex min-h-0 min-w-0 flex-col"
      >
        <NavigationAside title="Entity">
          <ErrorBoundary fallback={<QueryErrorFallback />}>
            <Suspense clientOnly fallback={<EntityContextListSkeleton />}>
              <EntityContextList />
            </Suspense>
          </ErrorBoundary>
        </NavigationAside>
      </ResizablePanel>
      <ResizableHandle />
      {shouldShowBrowserPanel ? (
        <>
          <ResizablePanel
            defaultSize={30}
            minSize={18}
            maxSize={40}
            className="flex min-h-0 min-w-0 flex-col"
          >
            <ErrorBoundary
              resetKeys={[contextId, modelId]}
              fallback={<QueryErrorFallback />}
            >
              <Suspense fallback={<EntityTableSkeleton />}>
                <EntitySelector
                  appendEntityTabList={entityTabListAction.append}
                />
              </Suspense>
            </ErrorBoundary>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={52}
            minSize={25}
            className="flex min-h-0 min-w-0 flex-col overflow-hidden"
          >
            {children}
          </ResizablePanel>
        </>
      ) : (
        <ResizablePanel
          defaultSize={82}
          minSize={30}
          className="flex min-h-0 min-w-0 flex-col"
        >
          {children}
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}
