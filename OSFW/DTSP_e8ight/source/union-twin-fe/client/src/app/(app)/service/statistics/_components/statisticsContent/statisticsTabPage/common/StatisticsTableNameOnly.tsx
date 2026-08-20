import { Card, CardHeader, CardTitle } from '@e8ight/ui/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';

import StatisticsTableItem from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/common/StatisticsTableItem';
import {
  useStatisticsTable,
  type StatisticsTableType,
} from '@/app/(app)/service/statistics/_hooks/useStatisticsTable';
import { returnStatesByType } from '@/app/(app)/service/statistics/_utils';

function StatisticsTableNameOnly({ type }: { type: StatisticsTableType }) {
  const { data } = useStatisticsTable(type);

  const modelList: string[] = Array.isArray(data) ? data : [];

  return (
    <Card className="border-border flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <CardHeader className="border-border border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-foreground text-sm font-bold tracking-[.03em]">
            {returnStatesByType(type)?.title}
          </CardTitle>
          <div className="text-muted-foreground text-sm">
            {modelList.length} items
          </div>
        </div>
      </CardHeader>

      {modelList.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <Empty className="max-w-sm border-0 bg-transparent">
            <EmptyHeader>
              <EmptyTitle>No model types found</EmptyTitle>
              <EmptyDescription>
                There are no collected model types for the selected day.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="relative h-full min-h-0 overflow-y-auto [&_[data-slot=table-container]]:overflow-visible">
          <Table className="table-fixed">
            <TableHeader className="bg-muted/40 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground h-10 px-4 text-xs">
                  {returnStatesByType(type)?.title}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelList.map((task: string) => (
                <StatisticsTableItem
                  key={task}
                  name={task}
                  task={null}
                  type={type}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

export default StatisticsTableNameOnly;
