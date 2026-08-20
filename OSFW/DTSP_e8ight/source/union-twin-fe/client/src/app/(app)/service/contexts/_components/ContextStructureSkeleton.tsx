import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@e8ight/ui/components/ui/card';
import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

export function ContextStructureSkeleton() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <Field>
        <FieldLabel>Context URI *</FieldLabel>
        <Skeleton className="h-9 w-full" />
      </Field>
      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
        <CardHeader className="border-border border-b py-3">
          <CardTitle>Context structure</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <Skeleton className="h-4 w-40" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-[96%]" />
          </div>
          <Skeleton className="h-px w-full shrink-0" />
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </CardFooter>
      </Card>
    </div>
  );
}
