import { ErrorBoundary, Suspense } from '@suspensive/react';
import { DatabaseZap, RadioTower } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import StatisticsDetail from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsDetail';
import { StatisticsDetailSkeleton } from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsDetailSkeleton';
import StatisticsSelectionPlaceholder from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsSelectionPlaceholder';
import StatisticsTable from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsTable';
import StatisticsTableNameOnly from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsTableNameOnly';
import { StatisticsTableNameOnlySkeleton } from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsTableNameOnlySkeleton';
import { StatisticsTableSkeleton } from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsTableSkeleton';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

function SourceStatistics() {
  const selectedItem = useStatisticsStore(useShallow((s) => s.selectedItems));

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 xl:flex-row">
      <ErrorBoundary fallback={<QueryErrorFallback />}>
        <Suspense fallback={<StatisticsTableNameOnlySkeleton />}>
          <StatisticsTableNameOnly type="dataModelNameList" />
        </Suspense>
      </ErrorBoundary>

      {selectedItem.dataModel !== '' ? (
        <>
          <ErrorBoundary fallback={<QueryErrorFallback />}>
            <Suspense fallback={<StatisticsTableSkeleton />}>
              <StatisticsTable type="sourceStatistics" />
            </Suspense>
          </ErrorBoundary>
          {selectedItem.provider !== '' ? (
            <ErrorBoundary fallback={<QueryErrorFallback />}>
              <Suspense fallback={<StatisticsDetailSkeleton />}>
                <StatisticsDetail />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <StatisticsSelectionPlaceholder
              title="Select a provider"
              description="Choose a row to inspect it."
              Icon={RadioTower}
            />
          )}
        </>
      ) : (
        <StatisticsSelectionPlaceholder
          title="Select a model first"
          description="Choose a model to load providers."
          Icon={DatabaseZap}
        />
      )}
    </div>
  );
}

export default SourceStatistics;
