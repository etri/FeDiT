import { queryOptions } from '@tanstack/react-query';

import {
  getSyncFederatedObjects,
  getSyncFederatedTwins,
} from '@/apis/fdtSync/fdtSyncApi';

export const fdtSyncKeys = {
  all: ['fdtSync'] as const,
  twins: () => [...fdtSyncKeys.all, 'twins'] as const,
  objects: (federatedTwinId: string) =>
    [...fdtSyncKeys.all, 'objects', federatedTwinId] as const,
} as const;

export const fdtSyncQueries = {
  twins: () =>
    queryOptions({
      queryKey: fdtSyncKeys.twins(),
      queryFn: getSyncFederatedTwins,
      staleTime: 5 * 60 * 1000,
    }),

  objects: (federatedTwinId: string) =>
    queryOptions({
      queryKey: fdtSyncKeys.objects(federatedTwinId),
      queryFn: () => getSyncFederatedObjects(federatedTwinId),
      enabled: Boolean(federatedTwinId),
      staleTime: 5 * 60 * 1000,
    }),
} as const;
