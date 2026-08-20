import { Card } from '@e8ight/ui/components/ui/card';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function UnionTwinsContentSkeleton() {
  const schemaRows = Array.from({ length: 5 }, (_, index) => index + 1);
  const formFields = Array.from({ length: 5 }, (_, index) => index + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row xl:gap-6">
      <Card className="h-64 w-full shrink-0 gap-0 py-0 lg:h-auto lg:w-[320px] xl:w-[380px]">
        <div className="flex items-center justify-between px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Separator />
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
          {schemaRows.map((row) => (
            <Skeleton key={row} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </Card>
      <Card className="min-h-0 min-w-0 flex-1 gap-0 py-0">
        <div className="flex flex-col gap-1.5 px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Separator />
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          {formFields.map((field) => (
            <div key={field} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex shrink-0 justify-end p-4">
          <Skeleton className="h-9 w-40" />
        </div>
      </Card>
    </div>
  );
}
