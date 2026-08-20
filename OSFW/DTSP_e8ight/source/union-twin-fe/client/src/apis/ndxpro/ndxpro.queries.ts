import { queryOptions } from '@tanstack/react-query';

import { getFdtTourData } from '@/apis/ndxpro/ndxproApi';

interface FdtTourParams {
  federatedDigitalObjectId: string;
  secretKey: string;
  measurePositionId?: string;
  enabled?: boolean;
}

const ndxproKeys = {
  all: ['ndxpro'] as const,
  fdtTour: (params: FdtTourParams) =>
    [
      ...ndxproKeys.all,
      'fdtTour',
      params.federatedDigitalObjectId,
      params.secretKey,
      params.measurePositionId,
    ] as const,
};

export const ndxproQueries = {
  fdtTour: (params: FdtTourParams) =>
    queryOptions({
      queryKey: ndxproKeys.fdtTour(params),
      queryFn: () =>
        getFdtTourData(
          params.federatedDigitalObjectId,
          params.secretKey,
          params.measurePositionId,
        ),
      enabled: params.enabled ?? true,
    }),
};
