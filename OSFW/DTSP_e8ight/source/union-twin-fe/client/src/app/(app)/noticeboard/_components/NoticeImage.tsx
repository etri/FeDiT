'use client';

import { useState } from 'react';

import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import { cn } from 'cn';
import { ImageOff } from 'lucide-react';

type Status = 'loading' | 'loaded' | 'error';

export function NoticeImage({
  src,
  alt,
  title,
  className,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [status, setStatus] = useState<Status>(src ? 'loading' : 'error');

  if (!src || status === 'error') {
    return (
      <span
        role="img"
        aria-label={alt || '이미지를 불러올 수 없습니다'}
        className="bg-muted/40 text-muted-foreground my-4 flex aspect-[16/9] w-full items-center justify-center rounded-lg border"
      >
        <span className="flex flex-col items-center gap-2 text-xs">
          <ImageOff className="size-6" />
          이미지를 불러올 수 없습니다
        </span>
      </span>
    );
  }

  return (
    <span className="relative my-4 block w-full overflow-hidden rounded-lg border">
      {status === 'loading' ? (
        <Skeleton className="aspect-[16/9] w-full rounded-none" />
      ) : null}
      <img
        {...rest}
        src={src}
        alt={alt ?? ''}
        title={title}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={cn(
          'block h-auto w-full transition-opacity duration-300',
          status === 'loading'
            ? 'pointer-events-none absolute inset-0 opacity-0'
            : 'opacity-100',
          className,
        )}
      />
    </span>
  );
}
