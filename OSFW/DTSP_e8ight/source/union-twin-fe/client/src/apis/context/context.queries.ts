import { queryOptions } from '@tanstack/react-query';

import {
  getContextData,
  getContextDetailData,
  getContextVersion,
  getContextVone,
} from '@/apis/context/contextApi';

export const contextKeys = {
  all: ['context'] as const,
  lists: () => [...contextKeys.all, 'list'] as const,
  versions: (contextUrl: string) =>
    [...contextKeys.all, 'versions', contextUrl] as const,
  info: (contextUrl: string) =>
    [...contextKeys.all, 'info', contextUrl] as const,
  detail: (contextUrl: string) =>
    [...contextKeys.all, 'detail', contextUrl] as const,
  vone: () => [...contextKeys.all, 'vone'] as const,
} as const;

export const contextQueries = {
  list: () =>
    queryOptions({
      queryKey: contextKeys.lists(),
      queryFn: getContextData,
    }),

  versions: (contextUrl: string) =>
    queryOptions({
      queryKey: contextKeys.versions(contextUrl),
      queryFn: () => getContextVersion({ params: { contextUrl } }),
      enabled: Boolean(contextUrl),
    }),

  info: (contextUrl: string) =>
    queryOptions({
      queryKey: contextKeys.info(contextUrl),
      queryFn: () => getContextDetailData(contextUrl),
      select: (data) => data['@context'] as Record<string, string>,
      enabled: Boolean(contextUrl),
    }),

  detail: (contextUrl: string) =>
    queryOptions({
      queryKey: contextKeys.detail(contextUrl),
      queryFn: () => getContextDetailData(contextUrl),
      enabled: Boolean(contextUrl),
    }),

  vone: () =>
    queryOptions({
      queryKey: contextKeys.vone(),
      queryFn: getContextVone,
    }),
} as const;
