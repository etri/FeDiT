import { Suspense } from 'react';

import { ErrorBoundary } from '@suspensive/react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';

import { noticeKeys } from '@/apis/notices';
import {
  getNoticeServer,
  isNoticeNotFoundError,
} from '@/apis/notices/notices.server';
import NoticeDetail, {
  NoticeDetailSkeleton,
} from '@/app/(app)/noticeboard/[id]/_components/NoticeDetail';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { getQueryClient } from '@/lib/get-query-client';

import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const notice = await getNoticeServer(id);
    return { title: notice.title };
  } catch {
    return { title: '공지사항' };
  }
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery({
      queryKey: noticeKeys.detail(id),
      queryFn: () => getNoticeServer(id),
    });
  } catch (e) {
    if (isNoticeNotFoundError(e)) notFound();
    throw e;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-6">
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense fallback={<NoticeDetailSkeleton />}>
            <NoticeDetail id={id} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </HydrationBoundary>
  );
}
