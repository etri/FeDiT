import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import {
  getAllAttrWithPage,
  getAttrData,
  getUsingDataModel,
} from '@/apis/attribute/attributeApi';

import type { PaginationParams } from '@/types/common';

const ATTRIBUTE_INFINITE_PAGE_SIZE = 22;

export const attributeKeys = {
  all: ['attribute'] as const,
  lists: () => [...attributeKeys.all, 'list'] as const,
  list: (payload: PaginationParams) =>
    [...attributeKeys.lists(), payload] as const,
  infiniteLists: () => [...attributeKeys.all, 'infinite-list'] as const,
  infiniteList: (payload: { word?: string | undefined }) =>
    [...attributeKeys.infiniteLists(), payload] as const,
  detail: (id: string) => [...attributeKeys.all, 'detail', id] as const,
  usingModels: (attributeId: string) =>
    [...attributeKeys.all, 'using', attributeId] as const,
} as const;

export const attributeQueries = {
  detail: (id: string) =>
    queryOptions({
      queryKey: attributeKeys.detail(id),
      queryFn: () => getAttrData(id),
      enabled: Boolean(id),
    }),

  list: (payload: PaginationParams) =>
    queryOptions({
      queryKey: attributeKeys.list(payload),
      queryFn: () => getAllAttrWithPage(payload),
    }),

  infiniteList: ({ word }: { word?: string | undefined }) =>
    infiniteQueryOptions({
      queryKey: attributeKeys.infiniteList({ word }),
      queryFn: ({ pageParam }) =>
        getAllAttrWithPage({
          curPage: pageParam,
          size: ATTRIBUTE_INFINITE_PAGE_SIZE,
          word,
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentPage = allPages.length - 1;
        return currentPage + 1 < lastPage.totalPage
          ? currentPage + 1
          : undefined;
      },
    }),

  usingModels: (attributeId: string) =>
    queryOptions({
      queryKey: attributeKeys.usingModels(attributeId),
      queryFn: () => getUsingDataModel(attributeId),
      enabled: Boolean(attributeId),
    }),
} as const;
