import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function EntityContextListSkeleton() {
  const rowKeys = Array.from({ length: 8 }, (_, rowNumber) => rowNumber + 1);

  return (
    <ul className="min-h-0 w-full min-w-0 space-y-1">
      {rowKeys.map((rowKey) => (
        <li key={rowKey} className="min-w-0">
          <Skeleton className="h-9 w-full rounded-lg" />
        </li>
      ))}
    </ul>
  );
}
