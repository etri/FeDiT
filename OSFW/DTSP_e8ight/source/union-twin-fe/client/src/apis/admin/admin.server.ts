import 'server-only';

import { fetchBff } from '@/lib/bff-fetch';

import type {
  AdminPaginatedResponse,
  AdminRole,
  AdminUser,
  UsersListParams,
} from '@/types/admin';

export async function getAdminUsersServer(
  params: UsersListParams,
): Promise<AdminPaginatedResponse<AdminUser>> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  const path = qs ? `/users?${qs}` : '/users';

  const res = await fetchBff(path, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AdminPaginatedResponse<AdminUser>;
}

export async function getAdminRolesServer(): Promise<AdminRole[]> {
  const res = await fetchBff('/roles', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch roles: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AdminRole[];
}
