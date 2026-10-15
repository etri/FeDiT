import { Card, CardHeader } from '@e8ight/ui/components/ui/card';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function StatisticsDetailSkeleton() {
  return (
    <Card className="border-border flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <CardHeader className="border-border flex-none border-b px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>

      <div className="grid flex-none grid-cols-1 gap-4 p-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <Skeleton className="mx-auto size-[150px] rounded-full" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="flex min-h-[200px] flex-col gap-2">
          <div className="flex items-end justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="min-h-0 flex-1 rounded-lg" />
        </div>
      </div>

      <div className="border-border min-h-0 flex-1 space-y-2 border-t p-4">
        {['first', 'second', 'third'].map((key) => (
          <Skeleton key={key} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </Card>
  );
}
