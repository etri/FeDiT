import { Suspense } from 'react';

import { ErrorBoundary } from '@suspensive/react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { adminKeys } from '@/apis/admin';
import {
  getAdminRolesServer,
  getAdminUsersServer,
} from '@/apis/admin/admin.server';
import CreateUserButton from '@/app/(app)/admin/users/_components/CreateUserButton';
import UserSearch from '@/app/(app)/admin/users/_components/UserSearch';
import UsersTable, {
  UsersTableSkeleton,
} from '@/app/(app)/admin/users/_components/UsersTable';
import { DEFAULT_USERS_QUERY } from '@/app/(app)/admin/users/_constants/users';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { getQueryClient } from '@/lib/get-query-client';

export default async function UsersPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery({
    queryKey: adminKeys.userList(DEFAULT_USERS_QUERY),
    queryFn: () => getAdminUsersServer(DEFAULT_USERS_QUERY),
  });
  void queryClient.prefetchQuery({
    queryKey: adminKeys.roleList(),
    queryFn: getAdminRolesServer,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-full flex-col gap-6 overflow-hidden p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-xl font-semibold">
              사용자 관리
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              사용자 계정을 조회하고 관리합니다
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <UserSearch />
            <CreateUserButton />
          </div>
        </div>
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense fallback={<UsersTableSkeleton />}>
            <UsersTable />
          </Suspense>
        </ErrorBoundary>
      </div>
    </HydrationBoundary>
  );
}
