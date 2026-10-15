'use client';

import { Card } from '@e8ight/ui/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import { useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Megaphone, SearchX } from 'lucide-react';

import { noticeQueries } from '@/apis/notices';
import { NoticeListItem } from '@/app/(app)/noticeboard/_components/NoticeListItem';
import { NoticesToolbar } from '@/app/(app)/noticeboard/_components/NoticesToolbar';
import { PinnedNoticeRow } from '@/app/(app)/noticeboard/_components/PinnedNoticeRow';
import { useNoticeSearch } from '@/app/(app)/noticeboard/_hooks/useNoticeSearch';
import { PaginationFooter } from '@/components/common/PaginationFooter';
import {
  useNoticesPageParam,
  useNoticesSortParam,
} from '@/hooks/useNoticesSearchParams';

export default function NoticesList() {
  const { page, size, setPage, setSize } = useNoticesPageParam();
  const { sortBy, sortOrder, setSort } = useNoticesSortParam();

  const { data: noticesData } = useSuspenseQuery(
    noticeQueries.list({ page, size, sortBy, sortOrder }),
  );
  const { data: notices, meta } = noticesData;
  const { keyword, setKeyword, results } = useNoticeSearch(notices);

  const pinnedNotices = results.filter((n) => n.isPinned);
  const restNotices = results.filter((n) => !n.isPinned);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <NoticesToolbar
        keyword={keyword}
        onKeywordChange={setKeyword}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSort}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
        {results.length === 0 ? (
          <Empty className="h-80">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {keyword ? <SearchX /> : <Megaphone />}
              </EmptyMedia>
              <EmptyTitle>
                {keyword ? '검색 결과가 없습니다' : '게시글이 없습니다'}
              </EmptyTitle>
              <EmptyDescription>
                {keyword
                  ? '다른 검색어로 시도해보세요'
                  : '아직 작성된 공지사항이 없습니다'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-10">
            {pinnedNotices.length > 0 ? (
              <section className="flex flex-col gap-4">
                <SectionLabel>고정 공지</SectionLabel>
                <div
                  className={cn(
                    'grid gap-4',
                    pinnedNotices.length > 1
                      ? '2xl:grid-cols-2'
                      : 'grid-cols-1',
                  )}
                >
                  {pinnedNotices.map((notice) => (
                    <PinnedNoticeRow key={notice.id} notice={notice} />
                  ))}
                </div>
              </section>
            ) : null}

            {restNotices.length > 0 ? (
              <section className="flex flex-col gap-4">
                {pinnedNotices.length > 0 ? (
                  <SectionLabel>최근 공지</SectionLabel>
                ) : null}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {restNotices.map((notice) => (
                    <NoticeListItem key={notice.id} notice={notice} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>

      {meta.totalPages > 0 && (
        <PaginationFooter
          meta={meta}
          page={page}
          size={size}
          onPageChange={setPage}
          onSizeChange={setSize}
          className="gap-4"
          controlsClassName="gap-3"
        />
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-foreground text-sm font-bold">{children}</h2>
      <div className="border-border/60 flex-1 border-t" />
    </div>
  );
}

export function NoticesListSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:max-w-sm" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden">
        <Skeleton className="h-44 w-full shrink-0 rounded-xl" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col gap-4 px-6 py-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="border-border/60 mt-2 flex items-center justify-between border-t pt-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
