import { DashboardSection } from '@/app/(app)/(home)/_components/DashboardSection';
import { dashboardGroups } from '@/components/layout/navigation';
import { PageContainer } from '@/components/layout/PageContainer';

export default function Page() {
  return (
    <PageContainer className="min-h-full gap-8">
      <header className="flex flex-col gap-1.5">
        <span className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
          Union Twin
        </span>
        <h1 className="text-foreground text-xl font-semibold">대시보드</h1>
        <p className="text-muted-foreground text-sm">
          연합트윈 플랫폼의 모든 도구를 한 곳에서 여세요
        </p>
      </header>

      {dashboardGroups.map((group) => (
        <DashboardSection
          key={group.label}
          label={group.label}
          items={group.items}
        />
      ))}
    </PageContainer>
  );
}
