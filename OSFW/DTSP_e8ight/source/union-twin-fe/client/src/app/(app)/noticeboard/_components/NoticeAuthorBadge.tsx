import { cn } from '@e8ight/ui/utils/cn';

import type { NoticeAuthor } from '@/types/noticeboard';

interface NoticeAuthorBadgeProps {
  author: NoticeAuthor | null | undefined;
  size: 'sm' | 'lg';
  showEmail?: boolean;
  className?: string;
}

const SIZE_CLASS = {
  sm: 'size-6',
  lg: 'size-10 text-sm',
};

const NAME_SIZE_CLASS = {
  sm: 'text-xs',
  lg: 'text-sm',
};

export function NoticeAuthorBadge({
  author,
  size,
  showEmail = false,
  className,
}: NoticeAuthorBadgeProps) {
  const initials = getInitials(author?.name);
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'bg-muted text-foreground flex shrink-0 items-center justify-center rounded-full font-semibold',
          SIZE_CLASS[size],
        )}
        aria-hidden
      >
        {initials}
      </div>
      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            'text-foreground truncate font-medium',
            NAME_SIZE_CLASS[size],
          )}
        >
          {author?.name ?? '익명'}
        </span>
        {showEmail && author?.email ? (
          <span className="text-muted-foreground truncate text-xs">
            {author.email}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return trimmed.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
