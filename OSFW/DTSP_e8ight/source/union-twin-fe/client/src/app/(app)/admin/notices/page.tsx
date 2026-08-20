import { Suspense } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';
import { ErrorBoundary } from '@suspensive/react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { noticeKeys } from '@/apis/notices';
import { getAdminNoticesServer } from '@/apis/notices/notices.server';
import NoticesAdminContent from '@/app/(app)/admin/notices/_components/NoticesAdminContent';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { getQueryClient } from '@/lib/get-query-client';
import {
  parseNoticeListParams,
  toSearchParams,
} from '@/lib/notice-list-params';

export default async function AdminNoticesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseNoticeListParams(toSearchParams(await searchParams));

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: noticeKeys.adminList(params),
    queryFn: () => getAdminNoticesServer(params),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-full flex-col gap-6 overflow-hidden p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-xl font-semibold">
              공지사항 관리
            </h1>
            <p className="text-muted-foreground text-sm">
              공지사항을 작성하고 관리합니다
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/noticeboard/write">
              <Plus className="size-4" />
              게시글 작성
            </Link>
          </Button>
        </div>
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense fallback={<NoticesTableSkeleton />}>
            <NoticesAdminContent />
          </Suspense>
        </ErrorBoundary>
      </div>
    </HydrationBoundary>
  );
}

function NoticesTableSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex gap-6">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">번호</TableHead>
              <TableHead className="w-28">상태</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-32">작성일</TableHead>
              <TableHead className="w-20">조회</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="text-center">
                  <Skeleton className="mx-auto h-5 w-6" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-64" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-10" />
                </TableCell>
                <TableCell>
                  <Skeleton className="size-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
