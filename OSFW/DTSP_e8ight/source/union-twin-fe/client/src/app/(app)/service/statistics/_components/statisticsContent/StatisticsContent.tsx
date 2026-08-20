'use client';

import { useEffect } from 'react';

import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useIsFetching } from '@tanstack/react-query';

import { statisticsKeys } from '@/apis/statistics';
import StatisticsAside from '@/app/(app)/service/statistics/_components/statisticsAside/StatisticsAside';
import StatisticsFixedTop from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsFixedTop/StatisticsFixedTop';
import { StatisticsFixedTopSkeleton } from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsFixedTop/StatisticsFixedTopSkeleton';
import StatisticsTabPage from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/StatisticsTabPage';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

function StatisticsContent() {
  const fetchingCount = useIsFetching({ queryKey: statisticsKeys.all });
  const toggleClickable = useStatisticsStore((s) => s.clickable);
  const setClickable = useStatisticsStore((s) => s.setClickable);

  useEffect(() => {
    setClickable(fetchingCount === 0);

    return () => {
      setClickable(true);
    };
  }, [fetchingCount, setClickable]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col xl:h-full xl:flex-row xl:overflow-hidden">
      {!toggleClickable && (
        <div className="absolute inset-0 z-[999]" aria-hidden="true" />
      )}
      <StatisticsAside />
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense clientOnly fallback={<StatisticsFixedTopSkeleton />}>
            <StatisticsFixedTop />
          </Suspense>
        </ErrorBoundary>
        <StatisticsTabPage />
      </div>
    </div>
  );
}

export default StatisticsContent;
