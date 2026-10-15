import { queryOptions } from '@tanstack/react-query';

import {
  getCollectionDateList,
  getFailStatisticsList,
  getModelStatisticsList,
  getSourceStatisticsList,
  getStatisticsByDateWithRange,
  getStatisticsTotal,
} from '@/apis/statistics/statisticsApi';

import type {
  DateParams,
  DateRangeParams,
  EntityStatisticsParams,
  FailEntityRecord,
  MonthParams,
} from '@/apis/statistics/statisticsApi';

export type StatisticsTableKind = 'model' | 'source';

const FAIL_FETCH_LIMIT = 5000;

export const failRecordTimeValue = (record: FailEntityRecord) => {
  const creDate = record.entity?.creDate;
  const time = creDate ? Date.parse(creDate) : Number.NaN;
  return Number.isNaN(time) ? 0 : time;
};

export const statisticsKeys = {
  all: ['statistics'] as const,
  dateRanges: () => [...statisticsKeys.all, 'date-range'] as const,
  dateRange: (params: DateRangeParams) =>
    [...statisticsKeys.dateRanges(), params] as const,
  totals: () => [...statisticsKeys.all, 'total'] as const,
  total: (params: EntityStatisticsParams) =>
    [...statisticsKeys.totals(), params] as const,
  modelSummaries: () => [...statisticsKeys.all, 'model-summary'] as const,
  modelSummary: (params: DateParams) =>
    [...statisticsKeys.modelSummaries(), params] as const,
  providerSummaries: () => [...statisticsKeys.all, 'provider-summary'] as const,
  providerSummary: (params: DateParams) =>
    [...statisticsKeys.providerSummaries(), params] as const,
  collectionDateLists: () =>
    [...statisticsKeys.all, 'collection-date-list'] as const,
  collectionDateList: (params: MonthParams) =>
    [...statisticsKeys.collectionDateLists(), params] as const,
  failures: () => [...statisticsKeys.all, 'fail'] as const,
  failure: (params: EntityStatisticsParams) =>
    [...statisticsKeys.failures(), params] as const,
} as const;

export const statisticsQueries = {
  dateRange: (params: DateRangeParams) =>
    queryOptions({
      queryKey: statisticsKeys.dateRange(params),
      queryFn: () => getStatisticsByDateWithRange(params),
      enabled: Boolean(params.startDate && params.endDate),
    }),

  total: (params: EntityStatisticsParams) =>
    queryOptions({
      queryKey: statisticsKeys.total(params),
      queryFn: () => getStatisticsTotal(params),
    }),

  collectionDates: (params: MonthParams) =>
    queryOptions({
      queryKey: statisticsKeys.collectionDateList(params),
      queryFn: () => getCollectionDateList(params),
    }),

  failures: (params: EntityStatisticsParams) =>
    queryOptions({
      queryKey: statisticsKeys.failure(params),
      queryFn: () =>
        getFailStatisticsList({
          ...params,
          offset: 0,
          limit: FAIL_FETCH_LIMIT,
        }),
      select: (page) => ({
        records: [...page.records].sort(
          (a, b) => failRecordTimeValue(b) - failRecordTimeValue(a),
        ),
        totalData: page.totalData,
      }),
    }),

  table: (kind: StatisticsTableKind, params: DateParams) =>
    queryOptions({
      queryKey:
        kind === 'source'
          ? statisticsKeys.providerSummary(params)
          : statisticsKeys.modelSummary({ date: params.date }),
      queryFn: () =>
        kind === 'source'
          ? getSourceStatisticsList(params)
          : getModelStatisticsList({ date: params.date }),
    }),
} as const;
