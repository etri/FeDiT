import { NavCard } from '@/app/(app)/(home)/_components/NavCard';

import type { DashboardNavigationItem } from '@/components/layout/types';

interface DashboardSectionProps {
  label: string;
  items: DashboardNavigationItem[];
}

export function DashboardSection({ label, items }: DashboardSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.06em] uppercase">
          {label}
        </h2>
        <span className="bg-border h-px flex-1" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <NavCard
            key={item.href}
            path={item.href}
            icon={item.icon}
            title={item.title}
          />
        ))}
      </div>
    </section>
  );
}
