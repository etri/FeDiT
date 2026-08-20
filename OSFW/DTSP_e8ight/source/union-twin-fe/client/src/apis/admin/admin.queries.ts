import { queryOptions } from '@tanstack/react-query';

import { getOrganizations, getRoles, getUsers } from '@/apis/admin/adminApi';

import type { UsersListParams } from '@/types/admin';

export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  userList: (params: UsersListParams) =>
    [...adminKeys.users(), params] as const,
  pendingDeletionCount: () =>
    [...adminKeys.users(), 'pending-deletion-count'] as const,
  roles: () => [...adminKeys.all, 'roles'] as const,
  roleList: () => [...adminKeys.roles(), 'list'] as const,
  organizations: () => [...adminKeys.all, 'organizations'] as const,
};

export const adminQueries = {
  userList: (params: UsersListParams) =>
    queryOptions({
      queryKey: adminKeys.userList(params),
      queryFn: () => getUsers(params),
    }),

  pendingDeletionCount: () =>
    queryOptions({
      queryKey: adminKeys.pendingDeletionCount(),
      queryFn: () => getUsers({ page: 1, size: 1, pendingDeletion: true }),
      select: (data) => data.meta.total,
    }),

  roleList: () =>
    queryOptions({
      queryKey: adminKeys.roleList(),
      queryFn: getRoles,
    }),

  organizations: () =>
    queryOptions({
      queryKey: adminKeys.organizations(),
      queryFn: getOrganizations,
      staleTime: 10 * 60_000,
    }),
};
