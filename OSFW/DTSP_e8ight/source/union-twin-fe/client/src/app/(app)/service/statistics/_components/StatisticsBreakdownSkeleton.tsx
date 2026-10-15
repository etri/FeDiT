import { Card } from '@e8ight/ui/components/ui/card';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function StatisticsBreakdownSkeleton() {
  return (
    <Card className="border-border flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <div className="flex-none space-y-2 p-3">
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-3 pt-0">
        {['first', 'second', 'third', 'fourth'].map((key) => (
          <Skeleton key={key} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </Card>
  );
}
