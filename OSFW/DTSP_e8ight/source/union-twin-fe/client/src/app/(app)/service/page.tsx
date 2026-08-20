import { NavCard } from '@/app/(app)/(home)/_components/NavCard';
import { dashboardNavigationItems } from '@/components/layout/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default function ServicePage() {
  const items = dashboardNavigationItems.filter((item) =>
    item.href.startsWith('/service/'),
  );

  return (
    <PageContainer>
      <PageHeader title="서비스 도구" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <NavCard
            key={item.href}
            path={item.href}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
          />
        ))}
      </div>
    </PageContainer>
  );
}
