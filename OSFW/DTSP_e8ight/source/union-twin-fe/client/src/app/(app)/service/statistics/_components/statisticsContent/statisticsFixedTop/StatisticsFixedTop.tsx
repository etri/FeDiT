import { useMemo } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@e8ight/ui/components/ui/card';
import { useSuspenseQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { statisticsQueries, type StatisticsRecord } from '@/apis/statistics';
import BarChart from '@/app/(app)/service/statistics/_components/statisticsContent/chart/BarChart';
import DonutChart from '@/app/(app)/service/statistics/_components/statisticsContent/chart/DonutChart';
import lang from '@/app/(app)/service/statistics/_constants/lang.json';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import {
  getRangeBefore,
  TREND_RANGE_DAYS,
} from '@/app/(app)/service/statistics/_utils';

function StatisticsFixedTop() {
  const date = useStatisticsStore((s) => s.currentDate);
  const currentWeek = useMemo(
    () => getRangeBefore(date, TREND_RANGE_DAYS),
    [date],
  );
  const { queryKey, queryFn } = statisticsQueries.dateRange(currentWeek);
  const { data } = useSuspenseQuery({ queryKey, queryFn });

  const currentWeekStatistics = Array.isArray(data.statistics)
    ? data.statistics
    : [];
  const currentDateStatistics =
    currentWeekStatistics[currentWeekStatistics.length - 1];

  const totalEntities = currentDateStatistics?.totalEntities ?? 0;
  const successEntities = currentDateStatistics?.successEntities ?? 0;
  const failEntities = currentDateStatistics?.failEntities ?? 0;
  const successRate =
    totalEntities > 0
      ? Number(((successEntities / totalEntities) * 100).toFixed(1))
      : 0;
  const failRate =
    totalEntities > 0
      ? Number(((failEntities / totalEntities) * 100).toFixed(1))
      : 0;
  const peakTotal = currentWeekStatistics.reduce(
    (max: number, item: StatisticsRecord) => Math.max(max, item.totalEntities),
    0,
  );

  return (
    <Card className="border-border flex-none overflow-hidden rounded-2xl">
      <CardHeader className="border-border border-b px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-foreground text-lg font-bold">
              {lang.en.allEntityStatistics}
            </CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {dayjs(date).format('dddd, MMMM D, YYYY')}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            {currentWeek.startDate} to {currentWeek.endDate}
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Activity className="size-4" />
                Total
              </div>
              <p className="text-foreground mt-3 font-mono text-sm font-bold">
                {totalEntities.toLocaleString()}
              </p>
            </div>

            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <CheckCircle2 className="text-primary size-4" />
                Success
              </div>
              <p className="text-foreground mt-3 font-mono text-sm font-bold">
                {successEntities.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {successRate}%
              </p>
            </div>

            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <AlertTriangle className="text-destructive size-4" />
                Fail
              </div>
              <p className="text-foreground mt-3 font-mono text-sm font-bold">
                {failEntities.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{failRate}%</p>
            </div>
          </div>

          <div className="border-border rounded-xl border p-4">
            <div className="flex items-end justify-between gap-3">
              <h3 className="text-foreground text-sm font-bold tracking-[.03em]">
                Trend
              </h3>
              <p className="text-muted-foreground text-sm">
                Peak {peakTotal.toLocaleString()}
              </p>
            </div>
            <div className="mt-4 h-[240px] min-h-0">
              <BarChart props={currentWeekStatistics} />
            </div>
          </div>
        </div>

        <div className="border-border flex min-h-0 flex-col gap-4 rounded-xl border p-4">
          <div className="flex items-end justify-between gap-3">
            <h3 className="text-foreground text-sm font-bold tracking-[.03em]">
              Composition
            </h3>
            <p className="text-muted-foreground text-sm">
              {successRate}% success
            </p>
          </div>

          <div className="flex min-h-[220px] flex-1 items-center justify-center">
            <DonutChart props={currentDateStatistics} />
          </div>

          <div className="text-muted-foreground grid gap-2 text-sm">
            <div className="bg-muted/20 flex items-center justify-between rounded-lg px-3 py-2">
              <span>Success</span>
              <span className="text-foreground text-sm font-bold">
                {successEntities.toLocaleString()}
              </span>
            </div>
            <div className="bg-muted/20 flex items-center justify-between rounded-lg px-3 py-2">
              <span>Fail</span>
              <span className="text-foreground text-sm font-bold">
                {failEntities.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatisticsFixedTop;
