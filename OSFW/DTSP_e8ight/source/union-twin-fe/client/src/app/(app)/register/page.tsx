import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { LayoutGrid } from 'lucide-react';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default function Page() {
  return (
    <PageContainer className="h-full">
      <PageHeader title="연합트윈 대시보드" />
      <Empty className="bg-muted h-full w-full rounded-lg">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayoutGrid />
          </EmptyMedia>
          <EmptyTitle>등록된 연합트윈이 없습니다</EmptyTitle>
          <EmptyDescription>
            새로운 연합트윈을 등록해 대시보드를 시작하세요.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="lg">연합트윈 등록</Button>
        </EmptyContent>
      </Empty>
    </PageContainer>
  );
}
