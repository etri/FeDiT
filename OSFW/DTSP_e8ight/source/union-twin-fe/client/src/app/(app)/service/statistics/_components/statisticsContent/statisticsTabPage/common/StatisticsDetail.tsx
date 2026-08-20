import { useMemo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@e8ight/ui/components/ui/card';
import { useSuspenseQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { statisticsQueries } from '@/apis/statistics';
import BarChart from '@/app/(app)/service/statistics/_components/statisticsContent/chart/BarChart';
import DonutChart from '@/app/(app)/service/statistics/_components/statisticsContent/chart/DonutChart';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import {
  getRangeBefore,
  TREND_RANGE_DAYS,
} from '@/app/(app)/service/statistics/_utils';

function StatisticsDetail() {
  const date = useStatisticsStore((s) => s.currentDate);
  const selectedItem = useStatisticsStore(useShallow((s) => s.selectedItems));

  const currentWeek = useMemo(
    () => getRangeBefore(date, TREND_RANGE_DAYS),
    [date],
  );
  const config = useMemo(
    () => ({
      ...currentWeek,
      dataModel: selectedItem.dataModel,
      provider: selectedItem.provider,
    }),
    [currentWeek, selectedItem.dataModel, selectedItem.provider],
  );

  const { queryKey, queryFn } = statisticsQueries.dateRange(config);
  const { data } = useSuspenseQuery({ queryKey, queryFn });

  const currentWeekStatistics = Array.isArray(data.statistics)
    ? data.statistics
    : [];
  const currentDateStatistics =
    currentWeekStatistics[currentWeekStatistics.length - 1];
  const success = currentDateStatistics?.successEntities ?? 0;
  const fail = currentDateStatistics?.failEntities ?? 0;
  const total = currentDateStatistics?.totalEntities ?? 0;
  const failProbability =
    total === 0 ? '0.0' : ((fail / total) * 100).toFixed(1);
  const successProbability =
    total === 0 ? '0.0' : (100 - Number(failProbability)).toFixed(1);

  const title = selectedItem.provider
    ? selectedItem.provider
    : selectedItem.dataModel;
  const sub = selectedItem.provider ? selectedItem.dataModel : '';

  return (
    <Card className="border-border flex h-full flex-1 flex-col overflow-hidden rounded-2xl lg:min-w-[320px]">
      <CardHeader className="border-border border-b px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 wrap-anywhere">
            <CardTitle className="text-foreground text-sm font-bold tracking-[.03em]">
              {title}
            </CardTitle>
            {sub && (
              <CardDescription className="mt-1 text-sm">{sub}</CardDescription>
            )}
          </div>
          <div className="text-muted-foreground text-sm">
            {dayjs(date).format('MMM D, YYYY')}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="grid grid-cols-1 gap-3">
            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Success
              </div>
              <p className="text-foreground mt-3 font-mono text-sm font-bold">
                {success.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {successProbability}%
              </p>
            </div>

            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <AlertTriangle className="text-destructive size-4" />
                Fail
              </div>
              <p className="text-foreground mt-3 font-mono text-sm font-bold">
                {fail.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {failProbability}%
              </p>
            </div>

            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">Total</p>
              <p className="text-foreground mt-3 font-mono text-sm font-bold">
                {total.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {currentWeek.startDate} to {currentWeek.endDate}
              </p>
            </div>
          </div>

          <div className="border-border rounded-xl border p-4">
            <div className="flex items-end justify-between gap-3">
              <h3 className="text-foreground text-sm font-bold tracking-[.03em]">
                Composition
              </h3>
              <p className="text-muted-foreground text-sm">
                {successProbability}% success
              </p>
            </div>
            <div className="mt-4 flex min-h-[220px] items-center justify-center">
              <DonutChart props={currentDateStatistics} />
            </div>
          </div>
        </div>

        <div className="border-border rounded-xl border p-4">
          <div className="flex items-end justify-between gap-3">
            <h3 className="text-foreground text-sm font-bold tracking-[.03em]">
              Trend
            </h3>
            <p className="text-muted-foreground text-sm">Last 7 days</p>
          </div>
          <div className="mt-4 h-[240px] min-h-0">
            <BarChart props={currentWeekStatistics} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatisticsDetail;
