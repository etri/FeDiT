import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import {
  getAllModelWithPage,
  getModel,
  getUnitCode,
  getUnitCodeGroup,
} from '@/apis/model/modelApi';

import type { PaginationParams } from '@/types/common';

const MODEL_SELECTOR_PAGE_SIZE = 20;

export const modelKeys = {
  all: ['data-model'] as const,
  lists: () => [...modelKeys.all, 'list'] as const,
  list: (payload: PaginationParams) => [...modelKeys.lists(), payload] as const,
  infiniteLists: () => [...modelKeys.all, 'infinite-list'] as const,
  infiniteList: (payload: {
    word?: string | undefined;
    isReady?: boolean | undefined;
  }) => [...modelKeys.infiniteLists(), payload] as const,
  detail: (modelId: string) => [...modelKeys.all, 'detail', modelId] as const,
  unitCodeGroups: () => [...modelKeys.all, 'unit-code-groups'] as const,
  unitCodes: (group: string) =>
    [...modelKeys.all, 'unit-codes', group] as const,
} as const;

export const modelQueries = {
  detail: (dataModelId: string | undefined) =>
    queryOptions({
      queryKey: modelKeys.detail(dataModelId ?? ''),
      queryFn: () => getModel({ dataModelId }),
      enabled: Boolean(dataModelId),
      staleTime: 5 * 60_000,
      gcTime: 15 * 60_000,
    }),

  list: (payload: PaginationParams) =>
    queryOptions({
      queryKey: modelKeys.list(payload),
      queryFn: () => getAllModelWithPage(payload),
    }),

  infiniteList: ({
    word,
    isReady,
  }: {
    word?: string | undefined;
    isReady?: boolean | undefined;
  }) =>
    infiniteQueryOptions({
      queryKey: modelKeys.infiniteList({ word, isReady }),
      queryFn: ({ pageParam }) =>
        getAllModelWithPage({
          curPage: pageParam,
          size: MODEL_SELECTOR_PAGE_SIZE,
          word,
          isReady,
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentPage = allPages.length - 1;
        return currentPage + 1 < lastPage.totalPage
          ? currentPage + 1
          : undefined;
      },
    }),

  unitCodeGroups: () =>
    queryOptions({
      queryKey: modelKeys.unitCodeGroups(),
      queryFn: getUnitCodeGroup,
      staleTime: 5 * 60_000,
      gcTime: 15 * 60_000,
    }),

  unitCodes: (group: string) =>
    queryOptions({
      queryKey: modelKeys.unitCodes(group),
      queryFn: () => getUnitCode(group),
      enabled: Boolean(group),
      staleTime: 5 * 60_000,
      gcTime: 15 * 60_000,
    }),
} as const;
