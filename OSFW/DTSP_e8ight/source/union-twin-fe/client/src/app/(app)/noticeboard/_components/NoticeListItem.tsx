import { Card } from '@e8ight/ui/components/ui/card';
import { cn } from 'cn';
import { ArrowUpRight, Clock, Eye } from 'lucide-react';
import Link from 'next/link';

import { NoticeAuthorBadge } from '@/app/(app)/noticeboard/_components/NoticeAuthorBadge';
import {
  estimateReadingMinutes,
  formatRelativeDate,
  stripMarkdown,
  truncate,
} from '@/app/(app)/noticeboard/_lib/notice-utils';

import type { Notice } from '@/types/noticeboard';

interface NoticeListItemProps {
  notice: Notice;
  className?: string;
}

export function NoticeListItem({ notice, className }: NoticeListItemProps) {
  const excerpt = truncate(stripMarkdown(notice.content), 180);
  const readingMinutes = estimateReadingMinutes(notice.content);
  const dateIso = notice.publishedAt ?? notice.createdAt;

  return (
    <Link
      href={`/noticeboard/${notice.id}`}
      className={cn(
        'focus-visible:ring-ring group block h-full rounded-xl focus:outline-none focus-visible:ring-2',
        className,
      )}
    >
      <Card className="hover:bg-accent/40 group-focus-visible:ring-ring relative flex h-full flex-col gap-4 border px-6 py-6 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <time
            dateTime={dateIso}
            title={dateIso}
            className="text-muted-foreground text-xs"
          >
            {formatRelativeDate(dateIso)}
          </time>
          <ArrowUpRight className="text-muted-foreground/40 group-hover:text-primary size-4 shrink-0 -translate-x-1 translate-y-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-sm font-bold transition-colors">
            {notice.title}
          </h3>
          {excerpt ? (
            <p className="text-muted-foreground line-clamp-3 text-sm leading-6">
              {excerpt}
            </p>
          ) : null}
        </div>

        <div className="border-border/60 mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <NoticeAuthorBadge author={notice.author} size="sm" />
          <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {readingMinutes}분
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
