import { Suspense } from 'react';

import { ErrorBoundary } from '@suspensive/react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { noticeKeys } from '@/apis/notices';
import { getNoticesServer } from '@/apis/notices/notices.server';
import NoticesList, {
  NoticesListSkeleton,
} from '@/app/(app)/noticeboard/_components/NoticesList';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { getQueryClient } from '@/lib/get-query-client';
import { NOTICE_LIST_DEFAULTS } from '@/lib/notice-list-params';

import type { NoticeListParams } from '@/types/noticeboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '공지사항',
  description: '최신 소식과 업데이트를 한 눈에 확인하세요.',
};

export const revalidate = 60;

const DEFAULT_LIST_PARAMS: NoticeListParams = {
  page: NOTICE_LIST_DEFAULTS.page,
  size: NOTICE_LIST_DEFAULTS.size,
  sortBy: NOTICE_LIST_DEFAULTS.sortBy,
  sortOrder: NOTICE_LIST_DEFAULTS.sortOrder,
};

export default async function NoticeboardPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: noticeKeys.list(DEFAULT_LIST_PARAMS),
    queryFn: () => getNoticesServer(DEFAULT_LIST_PARAMS),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-full w-full flex-col gap-6 overflow-hidden px-4 py-6 md:gap-8 md:px-8 md:py-10">
        <header className="flex flex-col gap-1.5">
          <h1 className="text-foreground text-xl font-semibold">공지사항</h1>
          <p className="text-muted-foreground text-sm">
            최신 소식과 업데이트를 한 눈에 확인하세요.
          </p>
        </header>
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense fallback={<NoticesListSkeleton />}>
            <NoticesList />
          </Suspense>
        </ErrorBoundary>
      </div>
    </HydrationBoundary>
  );
}
