'use client';

import { useDeferredValue, useEffect, useMemo } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@e8ight/ui/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@e8ight/ui/components/ui/tooltip';
import { cn } from '@e8ight/ui/utils/cn';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { adminQueries } from '@/apis/admin';
import { SortableTableHead } from '@/app/(app)/admin/_components/SortableTableHead';
import PendingDeletionBanner from '@/app/(app)/admin/users/_components/PendingDeletionBanner';
import {
  PAGE_SIZES,
  ROLE_BADGE_VARIANT,
  ROLE_LABELS,
  TABLE_HEADERS,
} from '@/app/(app)/admin/users/_constants/users';
import { useUserActions } from '@/app/(app)/admin/users/_hooks/useUserActions';
import { useUsersPageStore } from '@/app/(app)/admin/users/_stores/useUsersPageStore';

import type { AdminUser } from '@/types/admin';

export default function UsersTable() {
  const {
    search,
    page,
    size,
    sortBy,
    sortOrder,
    pendingOnly,
    setPage,
    setSize,
    toggleSort,
  } = useUsersPageStore(
    useShallow((s) => ({
      search: s.search,
      page: s.page,
      size: s.size,
      sortBy: s.sortBy,
      sortOrder: s.sortOrder,
      pendingOnly: s.pendingOnly,
      setPage: s.setPage,
      setSize: s.setSize,
      toggleSort: s.toggleSort,
    })),
  );

  const params = useMemo(
    () => ({
      page,
      size,
      sortBy,
      sortOrder,
      search: search || undefined,
      pendingDeletion: pendingOnly || undefined,
    }),
    [page, size, sortBy, sortOrder, search, pendingOnly],
  );
  const deferredParams = useDeferredValue(params);
  const isStale = params !== deferredParams;

  const { data: usersData } = useSuspenseQuery(
    adminQueries.userList(deferredParams),
  );
  const { data: roles } = useSuspenseQuery(adminQueries.roleList());

  const {
    handleEdit,
    handleHardDelete,
    handleToggleActive,
    handleApproveDeletion,
    handleRejectDeletion,
  } = useUserActions(roles);

  const lastPage = Math.max(1, usersData.meta.totalPages);

  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [lastPage, page, setPage]);

  const { data: users, meta } = usersData;

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 transition-opacity',
        isStale && 'pointer-events-none opacity-50',
      )}
    >
      <PendingDeletionBanner />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border [&>[data-slot=table-container]]:min-h-0 [&>[data-slot=table-container]]:flex-1 [&>[data-slot=table-container]]:overflow-y-auto">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-10">
            <TableRow>
              {TABLE_HEADERS.map((header) => (
                <SortableTableHead
                  key={header.key}
                  label={header.label}
                  column={header.key}
                  sortable={header.sortable}
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onToggleSort={toggleSort}
                />
              ))}
              <TableHead className="w-12 text-right">
                <span className="sr-only">관리</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_HEADERS.length + 1} className="h-60">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <Users />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>사용자를 찾을 수 없습니다</EmptyTitle>
                      <EmptyDescription>
                        검색 조건을 변경해보세요
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={() => handleEdit(user)}
                  onToggleActive={() => handleToggleActive(user)}
                  onDelete={() => handleHardDelete(user)}
                  onApproveDeletion={() => handleApproveDeletion(user)}
                  onRejectDeletion={() => handleRejectDeletion(user)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {meta.total === 0
            ? '전체 0명'
            : `전체 ${meta.total}명 중 ${(meta.page - 1) * meta.size + 1}-${Math.min(
                meta.page * meta.size,
                meta.total,
              )}`}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">표시:</span>
            <Select
              value={String(size)}
              onValueChange={(v) => setSize(Number(v))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-muted-foreground px-2 text-sm">
              {meta.page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onEdit,
  onToggleActive,
  onDelete,
  onApproveDeletion,
  onRejectDeletion,
}: {
  user: AdminUser;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onApproveDeletion: () => void;
  onRejectDeletion: () => void;
}) {
  const inactive = !user.isActive;
  const pendingDeletion = !!user.deletionRequestedAt;

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span
            className={cn(
              'text-sm font-bold',
              inactive ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {user.name}
          </span>
          <span className="text-muted-foreground text-xs">{user.email}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground min-w-32 whitespace-normal">
        {user.organization ?? '-'}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {user.phoneNumber ?? '-'}
      </TableCell>
      <TableCell>
        <Badge variant={ROLE_BADGE_VARIANT[user.role.name] ?? 'outline'}>
          {ROLE_LABELS[user.role.name] ?? user.role.name}
        </Badge>
      </TableCell>
      <TableCell>
        <UserStatusBadge user={user} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString('ko-KR', {
          timeZone: 'Asia/Seoul',
        })}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${user.name} 작업 메뉴`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil />
              수정
            </DropdownMenuItem>
            {pendingDeletion ? (
              <>
                <DropdownMenuItem onSelect={onRejectDeletion}>
                  <UserCheck />
                  탈퇴 거부 (계정 복구)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={onApproveDeletion}
                >
                  <Trash2 />
                  탈퇴 승인 (영구 삭제)
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onSelect={onToggleActive}>
                  {inactive ? <UserCheck /> : <UserX />}
                  {inactive ? '활성화' : '비활성화'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  <Trash2 />
                  영구 삭제
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function UserStatusBadge({ user }: { user: AdminUser }) {
  if (user.deletionRequestedAt) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive">탈퇴 요청</Badge>
        </TooltipTrigger>
        <TooltipContent>
          {new Date(user.deletionRequestedAt).toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
          })}{' '}
          탈퇴 요청 — 승인 시 영구 삭제됩니다
        </TooltipContent>
      </Tooltip>
    );
  }

  if (!user.isActive) {
    if (!user.deactivatedAt) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          비활성
        </Badge>
      );
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-muted-foreground">
            비활성
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {new Date(user.deactivatedAt).toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
          })}{' '}
          비활성화
        </TooltipContent>
      </Tooltip>
    );
  }

  return <Badge variant="secondary">활성</Badge>;
}

export function UsersTableSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border [&>[data-slot=table-container]]:min-h-0 [&>[data-slot=table-container]]:flex-1 [&>[data-slot=table-container]]:overflow-y-auto">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-10">
            <TableRow>
              {TABLE_HEADERS.map((header) => (
                <TableHead key={header.key}>{header.label}</TableHead>
              ))}
              <TableHead className="w-12">
                <span className="sr-only">관리</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: TABLE_HEADERS.length + 1 }).map(
                  (_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                  ),
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
