import { TableHead } from '@e8ight/ui/components/ui/table';
import { cn } from '@e8ight/ui/utils/cn';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import type { SortOrder } from '@/app/(app)/admin/_types/admin';

interface SortableTableHeadProps {
  label: string;
  column: string;
  sortable?: boolean;
  currentSortBy: string;
  currentSortOrder: SortOrder;
  onToggleSort: (column: string) => void;
  className?: string;
}

export function SortableTableHead({
  label,
  column,
  sortable,
  currentSortBy,
  currentSortOrder,
  onToggleSort,
  className,
}: SortableTableHeadProps) {
  if (!sortable) {
    return <TableHead className={className}>{label}</TableHead>;
  }

  const isActive = currentSortBy === column;

  const sortIcon = (() => {
    if (!isActive) {
      return <ArrowUpDown className="size-3.5 opacity-30" />;
    }
    if (currentSortOrder === 'ASC') {
      return <ArrowUp className="size-3.5" />;
    }
    return <ArrowDown className="size-3.5" />;
  })();

  return (
    <TableHead className={cn('p-0', className)}>
      <button
        type="button"
        className="hover:bg-muted/50 flex w-full items-center gap-1 px-3 py-2 text-left"
        onClick={() => onToggleSort(column)}
      >
        {label}
        {sortIcon}
      </button>
    </TableHead>
  );
}
