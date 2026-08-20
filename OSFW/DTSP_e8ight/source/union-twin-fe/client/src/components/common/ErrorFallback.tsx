'use client';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { AlertCircle } from 'lucide-react';

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="text-destructive size-6" />
          </EmptyMedia>
          <EmptyTitle>문제가 발생했습니다</EmptyTitle>
          <EmptyDescription>
            {error.message || '예기치 못한 오류가 발생했어요.'}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={reset}>
          다시 시도
        </Button>
      </Empty>
    </div>
  );
}
