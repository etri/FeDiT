import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function EntityBranchSkeleton() {
  const rowKeys = Array.from({ length: 3 }, (_, index) => index + 1);

  return (
    <ul className="mt-1 ml-3 min-w-0 space-y-1 border-l pl-3">
      {rowKeys.map((rowKey) => (
        <li key={rowKey} className="min-w-0">
          <Skeleton className="h-8 w-full rounded-lg" />
        </li>
      ))}
    </ul>
  );
}
