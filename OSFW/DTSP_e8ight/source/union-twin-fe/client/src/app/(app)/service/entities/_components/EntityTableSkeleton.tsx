import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';

export function EntityTableSkeleton() {
  const rowKeys = Array.from({ length: 8 }, (_, rowNumber) => rowNumber);

  return (
    <Table className="table-fixed">
      <TableHeader className="bg-background/95 sticky top-0 z-10 backdrop-blur-sm">
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-11 px-4">
            <Skeleton className="h-3 w-24" />
          </TableHead>
          <TableHead className="h-11 w-[28%] px-4">
            <Skeleton className="h-3 w-16" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rowKeys.map((rowKey) => (
          <TableRow key={rowKey} className="hover:bg-transparent">
            <TableCell className="px-4 py-3">
              <Skeleton className="h-4 w-3/4" />
            </TableCell>
            <TableCell className="px-4 py-3">
              <Skeleton className="h-4 w-1/2" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
