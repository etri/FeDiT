import { queryOptions } from '@tanstack/react-query';

import { getMe } from '@/apis/auth/authApi';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const authQueries = {
  me: () =>
    queryOptions({
      queryKey: authKeys.me(),
      queryFn: getMe,
      retry: false,
      staleTime: 5 * 60_000,
    }),
};
