import { Card, CardHeader } from '@e8ight/ui/components/ui/card';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';

export function StatisticsTableSkeleton() {
  return (
    <Card className="border-border flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <CardHeader className="border-border border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-14" />
        </div>
      </CardHeader>

      <div className="relative h-full min-h-0 overflow-y-auto [&_[data-slot=table-container]]:overflow-visible">
        <Table className="min-w-[560px] table-fixed">
          <TableHeader className="bg-muted/40 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 w-[40%] px-4">
                <Skeleton className="h-3 w-24" />
              </TableHead>
              <TableHead className="h-10 w-[20%] px-4">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="h-10 w-[20%] px-4">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="h-10 w-[20%] px-4">
                <Skeleton className="h-3 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Skeleton className="ml-auto h-4 w-10" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Skeleton className="ml-auto h-4 w-10" />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Skeleton className="ml-auto h-4 w-10" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
