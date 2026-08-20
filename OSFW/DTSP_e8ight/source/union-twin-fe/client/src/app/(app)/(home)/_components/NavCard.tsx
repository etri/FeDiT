import { Card } from '@e8ight/ui/components/ui/card';
import Link from 'next/link';

import type { LucideIcon } from 'lucide-react';

interface NavCardProps {
  path: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export function NavCard({ path, icon: Icon, title, subtitle }: NavCardProps) {
  return (
    <Link
      href={path}
      className="focus-visible:ring-ring/50 group rounded-xl focus-visible:ring-2 focus-visible:outline-none"
    >
      <Card className="hover:ring-primary/40 hover:bg-accent/40 flex h-full flex-row items-center gap-3 p-4 transition-colors">
        <Icon className="text-muted-foreground group-hover:text-foreground size-5 shrink-0 transition-colors" />
        <div className="flex min-w-0 flex-col">
          {subtitle && (
            <span className="text-muted-foreground truncate text-xs">
              {subtitle}
            </span>
          )}
          <span className="text-foreground truncate text-sm font-medium">
            {title}
          </span>
        </div>
      </Card>
    </Link>
  );
}
