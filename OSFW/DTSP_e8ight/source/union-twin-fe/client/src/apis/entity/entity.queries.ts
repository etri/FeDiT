import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import {
  getEntities,
  getEntityDetail,
  getIotEntityDetail,
  getIotEntityHistory,
} from '@/apis/entity/entityApi';

import type {
  EntitiesRequestType,
  EntityDetailRequestType,
  EntityDetailType,
  EntityHistoryRequestType,
  EntityHistoryDetailRequestType,
  EntityHistoryDetailType,
  EntitySearchInfoType,
} from '@/apis/entity/entity.types';

export const entityKeys = {
  all: ['entity'] as const,
  list: (
    contextId: string,
    modelId: string,
    isDynamic: boolean,
    pageLimit: number,
    searchInfo: EntitySearchInfoType,
  ) =>
    [
      ...entityKeys.all,
      'list',
      contextId,
      modelId,
      isDynamic,
      pageLimit,
      searchInfo,
    ] as const,
  history: (
    contextId: string,
    entityId: string,
    pageLimit: number,
    searchInfo: EntitySearchInfoType,
  ) =>
    [
      ...entityKeys.all,
      'history',
      contextId,
      entityId,
      pageLimit,
      searchInfo,
    ] as const,
  detail: (contextId: string, entityId: string) =>
    [...entityKeys.all, 'detail', contextId, entityId] as const,
  historyDetail: (historyId: string, timeproperty: string) =>
    [...entityKeys.all, 'history-detail', historyId, timeproperty] as const,
} as const;

export const entityQueries = {
  list: (variables: {
    contextId: string;
    modelId: string;
    isDynamic: boolean;
    pageLimit: number;
    searchInfo: EntitySearchInfoType;
    requestConfig: EntitiesRequestType | undefined;
  }) =>
    infiniteQueryOptions({
      queryKey: entityKeys.list(
        variables.contextId,
        variables.modelId,
        variables.isDynamic,
        variables.pageLimit,
        variables.searchInfo,
      ),
      enabled: Boolean(variables.requestConfig),
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => {
        if (!variables.requestConfig) {
          throw new Error('Entity list request config is not ready.');
        }

        const nextConfig: EntitiesRequestType = {
          headers: variables.requestConfig.headers,
          params: {
            ...variables.requestConfig.params,
            offset: pageParam,
          },
        };

        return getEntities(nextConfig);
      },
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPageParam + 1 < lastPage.totalPage ? lastPageParam + 1 : undefined,
    }),

  history: (variables: {
    contextId: string;
    entityId: string;
    pageLimit: number;
    searchInfo: EntitySearchInfoType;
    requestConfig: EntityHistoryRequestType | undefined;
  }) =>
    infiniteQueryOptions({
      queryKey: entityKeys.history(
        variables.contextId,
        variables.entityId,
        variables.pageLimit,
        variables.searchInfo,
      ),
      enabled: Boolean(variables.requestConfig),
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => {
        if (!variables.requestConfig) {
          throw new Error('Entity history request config is not ready.');
        }

        const nextConfig: EntityHistoryRequestType = {
          headers: variables.requestConfig.headers,
          params: {
            ...variables.requestConfig.params,
            offset: pageParam,
          },
        };

        return getIotEntityHistory(nextConfig);
      },
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPageParam + 1 < lastPage.totalPage ? lastPageParam + 1 : undefined,
    }),

  detailByMode: (variables: {
    isHistory: boolean;
    entityId: string | undefined;
    detailConfig: EntityDetailRequestType | undefined;
    historyId: string | undefined;
    historyConfig: EntityHistoryDetailRequestType | undefined;
  }) =>
    queryOptions({
      queryKey: variables.isHistory
        ? entityKeys.historyDetail(
            variables.historyId ?? '',
            variables.historyConfig?.params.timeproperty ?? '',
          )
        : entityKeys.detail(
            variables.detailConfig?.headers.Link ?? '',
            variables.entityId ?? '',
          ),
      queryFn: (): Promise<EntityDetailType | EntityHistoryDetailType> =>
        variables.isHistory
          ? getIotEntityDetail(
              variables.historyId as string,
              variables.historyConfig as EntityHistoryDetailRequestType,
            )
          : getEntityDetail(
              variables.entityId as string,
              variables.detailConfig as EntityDetailRequestType,
            ),
    }),
} as const;
