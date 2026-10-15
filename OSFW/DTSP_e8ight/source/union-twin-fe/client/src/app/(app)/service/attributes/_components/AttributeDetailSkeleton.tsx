'use client';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import { useIsMobile } from '@e8ight/ui/hooks';

function AttributeDetailSkeleton() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center gap-2 px-4 pt-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <ResizablePanelGroup
        direction={isMobile ? 'vertical' : 'horizontal'}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full space-y-4 overflow-auto p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={25}>
          <div className="h-full space-y-2 overflow-auto p-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className="flex shrink-0 justify-end gap-2 px-4 py-3">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-14" />
      </div>
    </div>
  );
}

export default AttributeDetailSkeleton;
