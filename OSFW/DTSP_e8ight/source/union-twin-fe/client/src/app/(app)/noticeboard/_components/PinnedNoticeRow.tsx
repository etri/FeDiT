import { Card } from '@e8ight/ui/components/ui/card';
import { cn } from '@e8ight/ui/utils/cn';
import { ArrowUpRight, Clock, Eye, Pin } from 'lucide-react';
import Link from 'next/link';

import { NoticeAuthorBadge } from '@/app/(app)/noticeboard/_components/NoticeAuthorBadge';
import {
  estimateReadingMinutes,
  formatRelativeDate,
  stripMarkdown,
  truncate,
} from '@/app/(app)/noticeboard/_lib/notice-utils';

import type { Notice } from '@/types/noticeboard';

interface PinnedNoticeRowProps {
  notice: Notice;
  className?: string;
}

export function PinnedNoticeRow({ notice, className }: PinnedNoticeRowProps) {
  const excerpt = truncate(stripMarkdown(notice.content), 260);
  const readingMinutes = estimateReadingMinutes(notice.content);
  const dateIso = notice.publishedAt ?? notice.createdAt;

  return (
    <Link
      href={`/noticeboard/${notice.id}`}
      className={cn(
        'focus-visible:ring-ring group block rounded-xl focus:outline-none focus-visible:ring-2',
        className,
      )}
    >
      <Card className="hover:bg-accent/40 relative flex flex-col gap-5 overflow-hidden border px-7 py-7 transition-colors md:flex-row md:items-stretch md:gap-8 md:px-8 md:py-8">
        <div className="md:w-1/3 md:max-w-[320px]">
          <div className="flex items-center gap-2">
            <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold">
              <Pin className="size-3" />
              고정 공지
            </span>
            <ArrowUpRight className="text-muted-foreground/60 ml-auto size-5 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 md:hidden" />
          </div>
          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <NoticeAuthorBadge author={notice.author} size="sm" />
            <span className="text-muted-foreground/40">·</span>
            <time dateTime={dateIso} title={dateIso}>
              {formatRelativeDate(dateIso)}
            </time>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-foreground group-hover:text-primary line-clamp-2 text-xl font-bold tracking-tight transition-colors md:text-2xl">
              {notice.title}
            </h2>
            <ArrowUpRight className="text-muted-foreground/60 hidden size-5 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 md:block" />
          </div>
          {excerpt ? (
            <p className="text-muted-foreground line-clamp-3 text-sm leading-6 md:text-[15px] md:leading-7">
              {excerpt}
            </p>
          ) : null}
          <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {readingMinutes}분 분량
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {notice.viewCount.toLocaleString('ko-KR')}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
