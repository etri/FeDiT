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

import ModelAside from '@/app/(app)/service/models/_components/dataModelAttributeContent/ModelAside';
import { ModelAsideSkeleton } from '@/app/(app)/service/models/_components/dataModelAttributeContent/ModelAsideSkeleton';
import { openAddDataModelDialog } from '@/app/(app)/service/models/_components/dataModelDetail/AddDataModelDialog';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleOpenNewDataModel = async () => {
    const createdId = await openAddDataModelDialog();
    if (!createdId) return;
    router.replace(`/service/models/${encodeURIComponent(createdId)}`);
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
          <Suspense clientOnly fallback={<ModelAsideSkeleton />}>
            <ModelAside onOpenNewDataModel={handleOpenNewDataModel} />
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
