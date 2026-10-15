'use client';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { ErrorBoundary, Suspense } from '@suspensive/react';

import StatisticsBreakdown from '@/app/(app)/service/statistics/_components/StatisticsBreakdown';
import { StatisticsBreakdownSkeleton } from '@/app/(app)/service/statistics/_components/StatisticsBreakdownSkeleton';
import StatisticsDetail from '@/app/(app)/service/statistics/_components/StatisticsDetail';
import { StatisticsDetailSkeleton } from '@/app/(app)/service/statistics/_components/StatisticsDetailSkeleton';
import StatisticsHeader from '@/app/(app)/service/statistics/_components/StatisticsHeader';
import StatisticsKpiStrip from '@/app/(app)/service/statistics/_components/StatisticsKpiStrip';
import { StatisticsKpiStripSkeleton } from '@/app/(app)/service/statistics/_components/StatisticsKpiStripSkeleton';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

function StatisticsContent() {
  return (
    <div className="flex min-h-0 flex-1 flex-col xl:h-full xl:overflow-hidden">
      <StatisticsHeader />
      <div className="flex-none px-4 pt-4">
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense clientOnly fallback={<StatisticsKpiStripSkeleton />}>
            <StatisticsKpiStrip />
          </Suspense>
        </ErrorBoundary>
      </div>
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="statistics-workspace"
        className="min-h-0 flex-1 p-4"
      >
        <ResizablePanel defaultSize={26} minSize={18} className="min-w-[240px]">
          <ErrorBoundary fallback={<QueryErrorFallback />}>
            <Suspense clientOnly fallback={<StatisticsBreakdownSkeleton />}>
              <StatisticsBreakdown />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
        <ResizableHandle withHandle className="mx-1.5 bg-transparent" />
        <ResizablePanel defaultSize={74} minSize={45}>
          <ErrorBoundary fallback={<QueryErrorFallback />}>
            <Suspense clientOnly fallback={<StatisticsDetailSkeleton />}>
              <StatisticsDetail />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default StatisticsContent;
