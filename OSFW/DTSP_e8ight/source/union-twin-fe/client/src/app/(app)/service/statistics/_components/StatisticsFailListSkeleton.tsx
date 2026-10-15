import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function StatisticsFailListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-border flex flex-none items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-[200px] rounded-lg" />
          <Skeleton className="h-8 w-[160px] rounded-lg" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-hidden p-4">
        {['first', 'second', 'third', 'fourth'].map((key) => (
          <Skeleton key={key} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
