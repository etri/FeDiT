import { useQuery } from '@tanstack/react-query';

import { authQueries } from '@/apis/auth/auth.queries';

export function useCurrentUser() {
  const { data: user } = useQuery(authQueries.me());
  return { user, isAdmin: user?.role.name === 'ADMIN' };
}
