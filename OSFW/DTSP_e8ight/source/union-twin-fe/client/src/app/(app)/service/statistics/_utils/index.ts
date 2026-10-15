import type { StatisticsRecord } from '@/apis/statistics';

const dateFormatter = (date: number | Date | undefined) => {
  const baseFormat = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return baseFormat.replaceAll('.', '').replaceAll(' ', '-');
};

export const getDate = (date: Date, num: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + num);
  return dateFormatter(nextDate);
};

export const getRangeBefore = (dateStr: string, num: number) => {
  const base = new Date(`${dateStr}T00:00:00`);
  return {
    startDate: getDate(base, -num),
    endDate: getDate(base, 0),
  };
};

export const TREND_RANGE_DAYS = 6;

export const LIVE_REFRESH_INTERVAL_MS = 30_000;

export const isToday = (dateStr: string) => dateStr === getDate(new Date(), 0);

export const liveRefetchInterval = (dateStr: string) =>
  isToday(dateStr) ? LIVE_REFRESH_INTERVAL_MS : false;

export interface TrendSummary {
  rangeTotal: number;
  rangeSuccess: number;
  rangeFail: number;
  dailyAverage: number;
  activeDays: number;
  observedDays: number;
  peak: StatisticsRecord | null;
  previousDayTotal: number;
}

export const summarizeTrend = (records: StatisticsRecord[]): TrendSummary => {
  const rangeTotal = records.reduce((sum, item) => sum + item.totalEntities, 0);
  const peak = records.reduce<StatisticsRecord | null>(
    (best, item) =>
      best === null || item.totalEntities > best.totalEntities ? item : best,
    null,
  );

  return {
    rangeTotal,
    rangeSuccess: records.reduce((sum, item) => sum + item.successEntities, 0),
    rangeFail: records.reduce((sum, item) => sum + item.failEntities, 0),
    dailyAverage: records.length ? Math.round(rangeTotal / records.length) : 0,
    activeDays: records.filter((item) => item.totalEntities > 0).length,
    observedDays: records.length,
    peak: peak !== null && peak.totalEntities > 0 ? peak : null,
    previousDayTotal: records[records.length - 2]?.totalEntities ?? 0,
  };
};

export const toRate = (value: number, total: number) =>
  total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;
