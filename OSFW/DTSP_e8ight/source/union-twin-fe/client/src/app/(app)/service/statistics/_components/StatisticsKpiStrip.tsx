import { useSuspenseQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Sigma,
  TrendingUp,
} from 'lucide-react';

import { statisticsQueries } from '@/apis/statistics';
import { StatisticsStatTile } from '@/app/(app)/service/statistics/_components/StatisticsStatTile';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import {
  getRangeBefore,
  liveRefetchInterval,
  summarizeTrend,
  toRate,
  TREND_RANGE_DAYS,
} from '@/app/(app)/service/statistics/_utils';

function StatisticsKpiStrip() {
  const date = useStatisticsStore((s) => s.currentDate);
  const refetchInterval = liveRefetchInterval(date);
  const currentWeek = getRangeBefore(date, TREND_RANGE_DAYS);
  const { queryKey, queryFn } = statisticsQueries.dateRange(currentWeek);
  const [{ data: summary }, { data: trend }] = useSuspenseQueries({
    queries: [
      { ...statisticsQueries.total({ date }), refetchInterval },
      { queryKey, queryFn, refetchInterval },
    ],
  });

  const currentWeekStatistics = Array.isArray(trend.statistics)
    ? trend.statistics
    : [];
  const currentDateStatistics = summary.statistics ?? undefined;

  const totalEntities = currentDateStatistics?.totalEntities ?? 0;
  const successEntities = currentDateStatistics?.successEntities ?? 0;
  const failEntities = currentDateStatistics?.failEntities ?? 0;

  const {
    dailyAverage,
    observedDays,
    peak,
    previousDayTotal,
    rangeFail,
    rangeTotal,
  } = summarizeTrend(currentWeekStatistics);
  const dayOverDay = totalEntities - previousDayTotal;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <StatisticsStatTile
        label="Total"
        value={totalEntities.toLocaleString()}
        meta={`${dayOverDay >= 0 ? '+' : ''}${dayOverDay.toLocaleString()} vs previous day`}
        Icon={Activity}
      />
      <StatisticsStatTile
        label="Success"
        value={successEntities.toLocaleString()}
        meta={`${toRate(successEntities, totalEntities)}%`}
        Icon={CheckCircle2}
        iconClassName="text-primary"
      />
      <StatisticsStatTile
        label="Fail"
        value={failEntities.toLocaleString()}
        meta={`${toRate(failEntities, totalEntities)}%`}
        Icon={AlertTriangle}
        iconClassName="text-destructive"
      />
      <StatisticsStatTile
        label={`${observedDays}-day total`}
        value={rangeTotal.toLocaleString()}
        meta={`${rangeFail.toLocaleString()} failed · ${toRate(rangeFail, rangeTotal)}%`}
        Icon={Sigma}
      />
      <StatisticsStatTile
        label="Daily average"
        value={dailyAverage.toLocaleString()}
        meta={`${currentWeek.startDate} – ${currentWeek.endDate}`}
        Icon={Gauge}
      />
      <StatisticsStatTile
        label="Peak day"
        value={peak ? peak.totalEntities.toLocaleString() : '0'}
        meta={peak ? dayjs(peak.date).format('MMM D, YYYY') : 'No data'}
        Icon={TrendingUp}
      />
    </div>
  );
}

export default StatisticsKpiStrip;
