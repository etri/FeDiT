'use client';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { cn } from '@e8ight/ui/utils/cn';
import { useErrorBoundaryFallbackProps } from '@suspensive/react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface QueryErrorFallbackProps {
  title?: string;
  className?: string;
}

export function QueryErrorFallback({
  title = '데이터를 불러오지 못했습니다',
  className,
}: QueryErrorFallbackProps) {
  const { reset } = useErrorBoundaryFallbackProps();
  const { reset: resetQuery } = useQueryErrorResetBoundary();

  function handleRetry() {
    resetQuery();
    reset();
  }

  return (
    <Empty className={cn('size-full', className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangle className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
      <Button variant="outline" size="sm" onClick={handleRetry}>
        <RefreshCw />
        다시 시도
      </Button>
    </Empty>
  );
}
