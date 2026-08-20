import { Card, CardContent, CardHeader } from '@e8ight/ui/components/ui/card';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function StatisticsFixedTopSkeleton() {
  return (
    <Card className="border-border flex-none overflow-hidden rounded-2xl">
      <CardHeader className="border-border border-b px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {['total', 'success', 'fail'].map((key) => (
              <div
                key={key}
                className="border-border bg-muted/20 rounded-xl border p-4"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="mt-3 h-4 w-20" />
                <Skeleton className="mt-2 h-3 w-10" />
              </div>
            ))}
          </div>

          <div className="border-border rounded-xl border p-4">
            <div className="flex items-end justify-between gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-4 h-[240px] w-full rounded-lg" />
          </div>
        </div>

        <div className="border-border flex min-h-0 flex-col gap-4 rounded-xl border p-4">
          <div className="flex items-end justify-between gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex min-h-[220px] flex-1 items-center justify-center">
            <Skeleton className="size-40 rounded-full" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
