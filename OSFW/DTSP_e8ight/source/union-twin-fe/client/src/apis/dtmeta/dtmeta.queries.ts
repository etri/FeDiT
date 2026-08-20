import { queryOptions } from '@tanstack/react-query';

import { searchFederatedTwins } from '@/apis/dtmeta/dtmetaApi';

export const dtmetaKeys = {
  all: ['dtmeta'] as const,
  federatedTwins: () => [...dtmetaKeys.all, 'federated-twins'] as const,
} as const;

export const dtmetaQueries = {
  federatedTwins: () =>
    queryOptions({
      queryKey: dtmetaKeys.federatedTwins(),
      queryFn: () => searchFederatedTwins(),
      staleTime: 5 * 60_000,
      gcTime: 15 * 60_000,
    }),
} as const;
