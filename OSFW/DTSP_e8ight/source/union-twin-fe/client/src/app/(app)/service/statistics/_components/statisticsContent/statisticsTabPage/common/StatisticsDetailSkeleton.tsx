import { Card, CardContent, CardHeader } from '@e8ight/ui/components/ui/card';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function StatisticsDetailSkeleton() {
  return (
    <Card className="border-border flex h-full flex-1 flex-col overflow-hidden rounded-2xl lg:min-w-[320px]">
      <CardHeader className="border-border border-b px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="grid grid-cols-1 gap-3">
            {['success', 'fail', 'total'].map((key) => (
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
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="mt-4 size-40 rounded-full" />
          </div>
        </div>

        <div className="border-border rounded-xl border p-4">
          <div className="flex items-end justify-between gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="mt-4 h-[240px] w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
