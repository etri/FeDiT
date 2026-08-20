import { queryOptions } from '@tanstack/react-query';

import {
  getModelStatisticsList,
  getModelStatisticsNameList,
  getSourceStatisticsList,
  getStatisticsByDateWithRange,
} from '@/apis/statistics/statisticsApi';

import type {
  DateParams,
  DateRangeParams,
} from '@/apis/statistics/statisticsApi';

export type StatisticsTableKind = 'model' | 'modelNameList' | 'source';

export const statisticsKeys = {
  all: ['statistics'] as const,
  dateRanges: () => [...statisticsKeys.all, 'date-range'] as const,
  dateRange: (params: DateRangeParams) =>
    [...statisticsKeys.dateRanges(), params] as const,
  modelSummaries: () => [...statisticsKeys.all, 'model-summary'] as const,
  modelSummary: (params: DateParams) =>
    [...statisticsKeys.modelSummaries(), params] as const,
  modelNameLists: () => [...statisticsKeys.all, 'model-name-list'] as const,
  modelNameList: (params: DateParams) =>
    [...statisticsKeys.modelNameLists(), params] as const,
  providerSummaries: () => [...statisticsKeys.all, 'provider-summary'] as const,
  providerSummary: (params: DateParams) =>
    [...statisticsKeys.providerSummaries(), params] as const,
} as const;

export const statisticsQueries = {
  dateRange: (params: DateRangeParams) =>
    queryOptions({
      queryKey: statisticsKeys.dateRange(params),
      queryFn: () => getStatisticsByDateWithRange(params),
      enabled: Boolean(params.startDate && params.endDate),
    }),

  table: (kind: StatisticsTableKind, params: DateParams) =>
    queryOptions({
      queryKey:
        kind === 'source'
          ? statisticsKeys.providerSummary(params)
          : kind === 'modelNameList'
            ? statisticsKeys.modelNameList({ date: params.date })
            : statisticsKeys.modelSummary({ date: params.date }),
      queryFn: () =>
        kind === 'source'
          ? getSourceStatisticsList(params)
          : kind === 'modelNameList'
            ? getModelStatisticsNameList({ date: params.date })
            : getModelStatisticsList({ date: params.date }),
    }),
} as const;
