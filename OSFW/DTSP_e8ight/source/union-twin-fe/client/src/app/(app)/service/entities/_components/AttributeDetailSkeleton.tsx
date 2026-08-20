import { Card, CardContent, CardHeader } from '@e8ight/ui/components/ui/card';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function AttributeDetailSkeleton() {
  const navigatorRowKeys = Array.from({ length: 8 }, (_, index) => index + 1);
  const inspectorRowKeys = Array.from({ length: 4 }, (_, index) => index + 1);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-2 pb-2">
        <Skeleton className="h-5 w-24" />
      </div>
      <Separator />
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-2 gap-2 pt-2 xl:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)] xl:grid-rows-1">
        <Card className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden py-0">
          <CardHeader className="bg-muted/40 flex flex-row items-center justify-between px-2 py-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8" />
          </CardHeader>
          <CardContent className="border-border flex min-h-0 flex-1 flex-col gap-1 border-t p-1">
            {navigatorRowKeys.map((rowKey) => (
              <Skeleton key={rowKey} className="h-9 w-full rounded-md" />
            ))}
          </CardContent>
        </Card>
        <Card className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden py-0">
          <CardHeader className="bg-muted/40 flex flex-row items-start justify-between gap-2 px-2 py-1.5">
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-7 w-24" />
          </CardHeader>
          <CardContent className="border-border flex min-h-0 flex-1 flex-col gap-2 border-t p-2">
            {inspectorRowKeys.map((rowKey) => (
              <Skeleton key={rowKey} className="h-16 w-full rounded-md" />
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
