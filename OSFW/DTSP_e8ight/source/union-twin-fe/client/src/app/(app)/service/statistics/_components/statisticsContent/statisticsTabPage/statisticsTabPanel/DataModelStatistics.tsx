import { ErrorBoundary, Suspense } from '@suspensive/react';
import { Box } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import StatisticsDetail from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsDetail';
import { StatisticsDetailSkeleton } from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsDetailSkeleton';
import StatisticsSelectionPlaceholder from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsSelectionPlaceholder';
import StatisticsTable from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsTable';
import { StatisticsTableSkeleton } from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsTableSkeleton';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

function DataModelStatistics() {
  const selectedItem = useStatisticsStore(useShallow((s) => s.selectedItems));

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 xl:flex-row">
      <ErrorBoundary fallback={<QueryErrorFallback />}>
        <Suspense clientOnly fallback={<StatisticsTableSkeleton />}>
          <StatisticsTable type="dataModelStatistics" />
        </Suspense>
      </ErrorBoundary>
      {selectedItem.dataModel !== '' ? (
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense fallback={<StatisticsDetailSkeleton />}>
            <StatisticsDetail />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <StatisticsSelectionPlaceholder
          title="Select a model"
          description="Choose a row to inspect it."
          Icon={Box}
        />
      )}
    </div>
  );
}

export default DataModelStatistics;
