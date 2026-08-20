'use client';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import { useIsMobile } from '@e8ight/ui/hooks';

function DataModelDetailSkeleton() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center gap-2 px-4 pt-4 pb-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-56 max-w-[40%]" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <ResizablePanelGroup
        direction={isMobile ? 'vertical' : 'horizontal'}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="h-full space-y-4 overflow-auto p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={65}>
          <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden p-4 md:flex-row">
            <div className="border-border flex min-w-0 flex-1 flex-col gap-1 rounded border p-2">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-[92%]" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-[88%]" />
              <Skeleton className="h-7 w-full" />
            </div>
            <Skeleton className="h-24 w-full shrink-0 md:h-full md:w-[32%] md:max-w-sm md:min-w-[12rem]" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default DataModelDetailSkeleton;
