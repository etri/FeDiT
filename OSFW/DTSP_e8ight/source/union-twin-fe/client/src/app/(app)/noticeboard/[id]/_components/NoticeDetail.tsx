'use client';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Eye, Pin, Share2 } from 'lucide-react';
import Link from 'next/link';

import { noticeQueries } from '@/apis/notices';
import { NoticeAuthorBadge } from '@/app/(app)/noticeboard/_components/NoticeAuthorBadge';
import { NoticeMarkdown } from '@/app/(app)/noticeboard/_components/NoticeMarkdown';
import {
  estimateReadingMinutes,
  formatAbsoluteDate,
  formatRelativeDate,
} from '@/app/(app)/noticeboard/_lib/notice-utils';

export default function NoticeDetail({ id }: { id: string }) {
  const { data: notice } = useSuspenseQuery(noticeQueries.detail(id));
  const publishedAt = notice.publishedAt ?? notice.createdAt;
  const readingMinutes = estimateReadingMinutes(notice.content);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다');
    } catch {
      toast.error('링크 복사에 실패했습니다');
    }
  }

  return (
    <article className="mx-auto w-full max-w-3xl pb-20">
      <nav className="bg-background/80 sticky top-0 z-10 -mx-6 mb-8 flex items-center justify-between border-b px-6 py-3 backdrop-blur-md">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/noticeboard">
            <ArrowLeft className="size-4" />
            목록으로
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="gap-1.5"
        >
          <Share2 className="size-4" />
          링크 복사
        </Button>
      </nav>

      <header className="flex flex-col gap-6">
        {(notice.isPinned || !notice.isPublished) && (
          <div className="flex flex-wrap gap-2">
            {notice.isPinned ? (
              <Badge variant="outline" className="text-muted-foreground">
                <Pin className="size-3" />
                고정 공지
              </Badge>
            ) : null}
            {!notice.isPublished ? (
              <Badge variant="outline">비공개</Badge>
            ) : null}
          </div>
        )}

        <h1 className="text-foreground text-xl font-semibold">
          {notice.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
          <NoticeAuthorBadge author={notice.author} size="lg" showEmail />
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <time dateTime={publishedAt} title={publishedAt}>
                {formatAbsoluteDate(publishedAt)}
              </time>
              <span
                className="text-muted-foreground/60"
                suppressHydrationWarning
              >
                ({formatRelativeDate(publishedAt)})
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {readingMinutes}분 분량
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5" />
              조회 {notice.viewCount.toLocaleString('ko-KR')}
            </span>
          </div>
        </div>
      </header>

      <Separator className="my-8" />

      <NoticeMarkdown source={notice.content} />
    </article>
  );
}

export function NoticeDetailSkeleton() {
  return (
    <article className="mx-auto w-full max-w-3xl pb-20">
      <nav className="mb-8 flex items-center justify-between border-b py-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </nav>

      <header className="flex flex-col gap-5">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-9 w-1/2" />
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </header>

      <div className="my-8 border-t" />

      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="my-4 h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </article>
  );
}
