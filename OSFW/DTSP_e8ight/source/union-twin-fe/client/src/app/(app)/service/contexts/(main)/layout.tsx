'use client';

import type { ReactNode } from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { useIsMobile } from '@e8ight/ui/hooks';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useRouter } from 'next/navigation';

import { openAddContextDialog } from '@/app/(app)/service/contexts/_components/AddContextDialog';
import { ContextAside } from '@/app/(app)/service/contexts/_components/ContextAside';
import { ContextAsideSkeleton } from '@/app/(app)/service/contexts/_components/ContextAsideSkeleton';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleOpenNewContext = async () => {
    const createdContextId = await openAddContextDialog();
    if (!createdContextId) return;
    router.replace(`/service/contexts/${encodeURIComponent(createdContextId)}`);
  };

  return (
    <ResizablePanelGroup
      direction={isMobile ? 'vertical' : 'horizontal'}
      className="bg-background h-full min-h-0 w-full"
    >
      <ResizablePanel
        defaultSize={20}
        minSize={15}
        maxSize={30}
        className="flex min-h-0 min-w-0 flex-col"
      >
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense clientOnly fallback={<ContextAsideSkeleton />}>
            <ContextAside onOpenNewContext={handleOpenNewContext} />
          </Suspense>
        </ErrorBoundary>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        defaultSize={80}
        className="flex min-h-0 min-w-0 flex-col"
      >
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
