import { queryOptions } from '@tanstack/react-query';

import {
  getTranslatorSample,
  getTranslators,
} from '@/apis/translator/translatorApi';

import type { TranslatorsRequestParams } from '@/apis/translator/translator.types';

export const translatorKeys = {
  all: ['translator'] as const,
  lists: () => [...translatorKeys.all, 'list'] as const,
  list: (params: TranslatorsRequestParams) =>
    [...translatorKeys.lists(), params] as const,
  samples: () => [...translatorKeys.all, 'sample'] as const,
  sample: (translatorName: string) =>
    [...translatorKeys.samples(), translatorName] as const,
} as const;

export const translatorQueries = {
  list: (params: TranslatorsRequestParams) =>
    queryOptions({
      queryKey: translatorKeys.list(params),
      queryFn: () => getTranslators(params),
      enabled: Boolean(params.agentId),
    }),

  sample: (translatorName: string) =>
    queryOptions({
      queryKey: translatorKeys.sample(translatorName),
      queryFn: () => getTranslatorSample(translatorName),
      enabled: Boolean(translatorName),
    }),
} as const;
