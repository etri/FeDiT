import { cn } from 'cn';

import type { LucideIcon } from 'lucide-react';

interface StatisticsStatTileProps {
  label: string;
  value: string;
  meta?: string;
  Icon?: LucideIcon;
  iconClassName?: string;
}

export function StatisticsStatTile({
  label,
  value,
  meta,
  Icon,
  iconClassName,
}: StatisticsStatTileProps) {
  return (
    <div className="border-border bg-muted/20 rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        {Icon && <Icon className={cn('size-4', iconClassName)} />}
        {label}
      </div>
      <p className="text-foreground mt-3 font-mono text-sm font-bold">
        {value}
      </p>
      {meta && <p className="text-muted-foreground mt-1 text-sm">{meta}</p>}
    </div>
  );
}
