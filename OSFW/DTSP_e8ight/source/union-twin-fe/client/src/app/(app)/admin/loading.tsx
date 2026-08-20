import { Card } from '@e8ight/ui/components/ui/card';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <Skeleton className="h-7 w-24" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="flex h-full flex-row items-center gap-3 p-4">
            <Skeleton className="size-11 shrink-0 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
    </div>
  );
}
