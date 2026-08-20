'use client';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { TriangleAlert } from 'lucide-react';

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Empty className="h-64">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>페이지를 불러오지 못했습니다</EmptyTitle>
        <EmptyDescription>
          페이지를 불러오는 중 오류가 발생했습니다
        </EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" onClick={reset}>
        다시 시도
      </Button>
    </Empty>
  );
}
