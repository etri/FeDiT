import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';

import { convertFullDateTimeFromString } from '@/lib/date';

import type { EntityHistoryDto } from '@/apis/entity';

interface IProps {
  entitiesHistoryData: EntityHistoryDto[];
  activeHistoryId: string | undefined;
  onSelectHistory: (historyData: EntityHistoryDto) => void;
}

function EntityHistoryTable({
  entitiesHistoryData,
  activeHistoryId,
  onSelectHistory,
}: IProps) {
  return (
    <Table className="table-fixed">
      <TableHeader className="bg-background/95 sticky top-0 z-10 backdrop-blur-sm">
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-11 px-4 font-bold tracking-[0.07em] uppercase">
            Observed Time
          </TableHead>
          <TableHead className="h-11 w-[28%] px-4 font-bold tracking-[0.07em] uppercase">
            Provider
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entitiesHistoryData.map((data) => {
          const observedAt = convertFullDateTimeFromString(data.observedAt);
          const isActive = activeHistoryId === data.historyId;

          return (
            <TableRow
              key={data.historyId}
              data-state={isActive ? 'selected' : undefined}
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => onSelectHistory(data)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectHistory(data);
                }
              }}
            >
              <TableCell className="px-4 py-3">
                <div
                  title={observedAt}
                  className="truncate text-sm font-medium"
                >
                  {observedAt}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div
                  title={data.provider}
                  className="text-muted-foreground truncate text-sm"
                >
                  {data.provider}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default EntityHistoryTable;
