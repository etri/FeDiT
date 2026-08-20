import { NavCard } from '@/app/(app)/(home)/_components/NavCard';
import { adminNavigation } from '@/components/layout/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '관리',
};

export default function AdminPage() {
  return (
    <PageContainer>
      <PageHeader title="관리" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {adminNavigation.map((item) =>
          item.href && item.icon ? (
            <NavCard
              key={item.href}
              path={item.href}
              icon={item.icon}
              title={item.title}
            />
          ) : null,
        )}
      </div>
    </PageContainer>
  );
}
