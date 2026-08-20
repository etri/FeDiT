import { Card, CardContent } from '@e8ight/ui/components/ui/card';

import { DownloadCard } from '@/app/(app)/physics/_components/DownloadCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default function Page() {
  return (
    <PageContainer className="relative min-h-full">
      <PageHeader title="물리 시물레이션 전후처리 도구" />

      <Card className="py-6">
        <CardContent className="px-6">
          <p className="text-foreground mb-6 text-sm font-bold tracking-[.03em]">
            제공 기능
          </p>
          <div className="text-muted-foreground ml-4">
            <p className="mb-4">
              물리 시물레이션 해석을 위한 전처리 기능 제공(해석 설정, 경계 조건
              등)
            </p>
            <p className="mb-4">
              LBM 해석 결과 데이터의 3차원 시각화 및 스트림 출력 기능 제공
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="py-6">
        <CardContent className="flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-foreground mb-6 text-sm font-bold tracking-[.03em]">
              설치 가이드
            </p>
            <div className="text-muted-foreground ml-4">
              <p className="mb-4">어떻게 사용할 수 있나요?</p>
              <p className="mb-4">
                오른쪽 사용하기 버튼을 클릭하시면 다운로드가 가능합니다.
              </p>
            </div>
          </div>

          <DownloadCard />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
