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

import { openAddAttributeSchemaDialog } from '@/app/(app)/service/attributes/_components/AddAttributeSchemaDialog';
import AttributeAside from '@/app/(app)/service/attributes/_components/AttributeAside';
import { AttributeAsideSkeleton } from '@/app/(app)/service/attributes/_components/AttributeAsideSkeleton';
import { openAddAttributeDialog } from '@/app/(app)/service/attributes/_components/AttributeDetail';
import AttributeDetailSkeleton from '@/app/(app)/service/attributes/_components/AttributeDetailSkeleton';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleOpenNewAttribute = async () => {
    const createdId = await openAddAttributeDialog();
    if (!createdId) return;
    router.replace(`/service/attributes/${encodeURIComponent(createdId)}`);
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
        className="flex min-h-0 flex-col"
      >
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense clientOnly fallback={<AttributeAsideSkeleton />}>
            <AttributeAside
              onOpenNewAttribute={handleOpenNewAttribute}
              onOpenAddAttributeSchema={() =>
                void openAddAttributeSchemaDialog()
              }
            />
          </Suspense>
        </ErrorBoundary>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80} className="flex min-h-0 flex-col">
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense fallback={<AttributeDetailSkeleton />}>{children}</Suspense>
        </ErrorBoundary>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
