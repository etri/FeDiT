'use client';

import type { ReactNode } from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { useIsMobile } from '@e8ight/ui/hooks';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { BookOpen, FileCode } from 'lucide-react';

import TreeHistoryProvider from '@/app/(app)/service/entities/_components/contexts/TreeHistoryProvider';
import EntityContextList from '@/app/(app)/service/entities/_components/EntityContextList';
import { EntityContextListSkeleton } from '@/app/(app)/service/entities/_components/EntityContextListSkeleton';
import { openEntityQueryGuideDialog } from '@/app/(app)/service/entities/_components/EntityQueryGuideDialog';
import EntitySelector from '@/app/(app)/service/entities/_components/EntitySelector';
import { EntityTableSkeleton } from '@/app/(app)/service/entities/_components/EntityTableSkeleton';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import useEntityTabList from '@/app/(app)/service/entities/_hooks/useEntityTabList';
import { useSyncEntityRouteWithTabs } from '@/app/(app)/service/entities/_hooks/useSyncEntityRouteWithTabs';
import { NavigationAside } from '@/components/common/NavigationAside';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { useRuntimeConfig } from '@/components/providers/RuntimeConfigProvider';

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
  const { brokerUrl } = useRuntimeConfig();

  const shouldShowBrowserPanel = Boolean(contextId) && Boolean(modelId);

  return (
    <ResizablePanelGroup
      direction={isMobile ? 'vertical' : 'horizontal'}
      className="bg-background h-full min-h-0 w-full"
    >
      <ResizablePanel
        defaultSize={isMobile ? 34 : 18}
        minSize={isMobile ? 25 : 12}
        maxSize={isMobile ? 50 : 28}
        className="flex min-h-0 min-w-0 flex-col"
      >
        <NavigationAside
          title="Entity"
          newAction={{
            label: '조회 가이드',
            title: '엔티티 조회 가이드',
            ariaLabel: '엔티티 조회 가이드 열기',
            icon: <BookOpen className="size-4" />,
            onClick: () => void openEntityQueryGuideDialog(),
          }}
          secondaryNewAction={{
            title: '엔티티 조회 API 문서 (Swagger, 새 탭)',
            ariaLabel: '엔티티 조회 API 문서 새 탭에서 열기',
            icon: <FileCode className="size-4" />,
            onClick: () =>
              window.open(
                `${brokerUrl}/swagger-ui/index.html`,
                '_blank',
                'noopener,noreferrer',
              ),
          }}
        >
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
            defaultSize={isMobile ? 33 : 30}
            minSize={isMobile ? 25 : 18}
            maxSize={isMobile ? 45 : 40}
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
            defaultSize={isMobile ? 33 : 52}
            minSize={25}
            className="flex min-h-0 min-w-0 flex-col overflow-hidden"
          >
            {children}
          </ResizablePanel>
        </>
      ) : (
        <ResizablePanel
          defaultSize={isMobile ? 66 : 82}
          minSize={30}
          className="flex min-h-0 min-w-0 flex-col"
        >
          {children}
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}
