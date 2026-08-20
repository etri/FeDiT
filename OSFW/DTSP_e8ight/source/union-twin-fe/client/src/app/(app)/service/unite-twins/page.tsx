import { ErrorBoundary, Suspense } from '@suspensive/react';

import { UnionTwinsContent } from '@/app/(app)/service/unite-twins/_components/UnionTwinsContent';
import { UnionTwinsContentSkeleton } from '@/app/(app)/service/unite-twins/_components/UnionTwinsContentSkeleton';
import { UnionTwinsGuide } from '@/app/(app)/service/unite-twins/_components/UnionTwinsGuide';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default function Page() {
  return (
    <PageContainer className="lg:h-full lg:overflow-hidden">
      <PageHeader title="단일 트윈 통합" />
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <UnionTwinsGuide />
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense clientOnly fallback={<UnionTwinsContentSkeleton />}>
            <UnionTwinsContent />
          </Suspense>
        </ErrorBoundary>
      </div>
    </PageContainer>
  );
}
