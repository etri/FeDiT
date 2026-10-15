import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function StatisticsKpiStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {['total', 'success', 'fail', 'range', 'average', 'peak'].map((key) => (
        <div
          key={key}
          className="border-border bg-muted/20 rounded-xl border p-4"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="mt-3 h-4 w-16" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
