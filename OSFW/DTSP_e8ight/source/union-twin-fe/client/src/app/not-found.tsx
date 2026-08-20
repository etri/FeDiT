import Link from 'next/link';

import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NotFound() {
  return (
    <PageContainer className="justify-center">
      <PageHeader title="페이지를 찾을 수 없습니다" />

      <div className="bg-muted/40 border-border flex max-w-xl flex-col gap-4 rounded-lg border p-6">
        <p className="text-muted-foreground text-sm leading-6">
          요청한 경로가 없거나 더 이상 지원되지 않습니다.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/service"
            className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
          >
            서비스 도구로 이동
          </Link>
          <Link
            href="/"
            className="border-border bg-background text-foreground inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
