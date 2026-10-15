import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@e8ight/ui/components/ui/card';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useSuspenseQueries } from '@tanstack/react-query';
import { cn } from 'cn';
import dayjs from 'dayjs';
import { useShallow } from 'zustand/react/shallow';

import { statisticsQueries } from '@/apis/statistics';
import BarChart from '@/app/(app)/service/statistics/_components/chart/BarChart';
import DonutChart from '@/app/(app)/service/statistics/_components/chart/DonutChart';
import StatisticsFailList from '@/app/(app)/service/statistics/_components/StatisticsFailList';
import { StatisticsFailListSkeleton } from '@/app/(app)/service/statistics/_components/StatisticsFailListSkeleton';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import {
  getRangeBefore,
  liveRefetchInterval,
  toRate,
  TREND_RANGE_DAYS,
} from '@/app/(app)/service/statistics/_utils';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

function CompositionRow({
  colorClassName,
  label,
  rate,
  value,
}: {
  colorClassName: string;
  label: string;
  rate: number;
  value: number;
}) {
  return (
    <div className="border-border bg-muted/20 flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-foreground flex items-center gap-2 text-sm">
        <span className={cn('size-2 rounded-full', colorClassName)} />
        {label}
      </span>
      <span className="text-foreground font-mono text-sm font-bold">
        {value.toLocaleString()}
        <span className="text-muted-foreground ml-1.5 font-normal">
          {rate}%
        </span>
      </span>
    </div>
  );
}

function StatisticsDetail() {
  const date = useStatisticsStore((s) => s.currentDate);
  const selectedItem = useStatisticsStore(useShallow((s) => s.selectedItems));

  const refetchInterval = liveRefetchInterval(date);
  const currentWeek = getRangeBefore(date, TREND_RANGE_DAYS);
  const { queryKey, queryFn } = statisticsQueries.dateRange({
    ...currentWeek,
    dataModel: selectedItem.dataModel,
    provider: selectedItem.provider,
  });
  const [{ data: summary }, { data: trend }] = useSuspenseQueries({
    queries: [
      {
        ...statisticsQueries.total({
          date,
          dataModel: selectedItem.dataModel || undefined,
          provider: selectedItem.provider || undefined,
        }),
        refetchInterval,
      },
      { queryKey, queryFn, refetchInterval },
    ],
  });

  const currentWeekStatistics = Array.isArray(trend.statistics)
    ? trend.statistics
    : [];
  const currentDateStatistics = summary.statistics ?? undefined;
  const success = currentDateStatistics?.successEntities ?? 0;
  const fail = currentDateStatistics?.failEntities ?? 0;
  const total = currentDateStatistics?.totalEntities ?? 0;
  const successProbability = toRate(success, total);
  const failProbability = toRate(fail, total);

  const title = selectedItem.provider || selectedItem.dataModel || 'All models';
  const scope = selectedItem.provider
    ? `Provider · ${selectedItem.dataModel}`
    : selectedItem.dataModel
      ? 'Model type'
      : 'Every data model collected on this day';

  return (
    <Card className="border-border flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <CardHeader className="border-border flex-none border-b px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 wrap-anywhere">
            <CardTitle className="text-foreground text-sm font-bold tracking-[.03em]">
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1 text-xs">
              {scope} · {dayjs(date).format('MMM D, YYYY')}
            </CardDescription>
          </div>
          {total > 0 && (
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs',
                fail > success
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-primary/30 bg-primary/10 text-primary',
              )}
            >
              {successProbability}% success
            </span>
          )}
        </div>
      </CardHeader>

      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={48} minSize={30}>
          <CardContent className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="mx-auto h-[150px] w-[150px] flex-none">
                <DonutChart props={currentDateStatistics} />
              </div>
              <CompositionRow
                label="Success"
                value={success}
                rate={successProbability}
                colorClassName="bg-primary"
              />
              <CompositionRow
                label="Fail"
                value={fail}
                rate={failProbability}
                colorClassName="bg-destructive"
              />
            </div>
            <div className="flex min-h-[200px] min-w-0 flex-col">
              <div className="flex flex-none items-end justify-between gap-3">
                <h3 className="text-foreground text-sm font-bold tracking-[.03em]">
                  7-day trend
                </h3>
                <p className="text-muted-foreground text-xs">
                  {currentWeek.startDate} – {currentWeek.endDate}
                </p>
              </div>
              <div className="mt-2 min-h-0 flex-1">
                <BarChart props={currentWeekStatistics} />
              </div>
            </div>
          </CardContent>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={52} minSize={25}>
          <ErrorBoundary fallback={<QueryErrorFallback />}>
            <Suspense fallback={<StatisticsFailListSkeleton />}>
              <StatisticsFailList />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Card>
  );
}

export default StatisticsDetail;
