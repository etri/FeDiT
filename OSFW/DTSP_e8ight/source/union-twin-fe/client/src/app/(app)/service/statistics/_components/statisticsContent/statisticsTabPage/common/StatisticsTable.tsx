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
import lang from '@/app/(app)/service/statistics/_constants/lang.json';
import {
  useStatisticsTable,
  type StatisticsTableType,
} from '@/app/(app)/service/statistics/_hooks/useStatisticsTable';
import { returnStatesByType } from '@/app/(app)/service/statistics/_utils';

import type { StatisticsSummary } from '@/app/(app)/service/statistics/_types';

function StatisticsTable({ type }: { type: StatisticsTableType }) {
  const { data } = useStatisticsTable(type);

  const statisticsList = (Array.isArray(data.statistics) ? data.statistics : [])
    .filter((task: StatisticsSummary) => {
      const nameValue = task.dataModel ?? task.provider ?? '';

      return (
        nameValue &&
        typeof nameValue === 'string' &&
        task.successEntities !== undefined &&
        task.failEntities !== undefined &&
        task.totalEntities !== undefined
      );
    })
    .sort(
      (a: StatisticsSummary, b: StatisticsSummary) =>
        b.totalEntities - a.totalEntities,
    );

  return (
    <Card className="border-border flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <CardHeader className="border-border border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-foreground text-sm font-bold tracking-[.03em]">
            {returnStatesByType(type)?.title}
          </CardTitle>
          <div className="text-muted-foreground text-sm">
            {statisticsList.length} items
          </div>
        </div>
      </CardHeader>

      {statisticsList.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <Empty className="max-w-sm border-0 bg-transparent">
            <EmptyHeader>
              <EmptyTitle>No statistics found</EmptyTitle>
              <EmptyDescription>
                There is no data to rank for the selected day.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="relative h-full min-h-0 overflow-y-auto [&_[data-slot=table-container]]:overflow-visible">
          <Table className="min-w-[560px] table-fixed">
            <TableHeader className="bg-muted/40 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground h-10 w-[40%] px-4 text-xs">
                  {returnStatesByType(type)?.title}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 w-[20%] px-4 text-xs">
                  {lang.en.success}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 w-[20%] px-4 text-xs">
                  {lang.en.fail}
                </TableHead>
                <TableHead className="text-muted-foreground h-10 w-[20%] px-4 text-xs">
                  {lang.en.total}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statisticsList.map((task: StatisticsSummary) => {
                const nameValue = task.dataModel ?? task.provider ?? '';

                return (
                  <StatisticsTableItem
                    key={nameValue}
                    name={nameValue}
                    task={task}
                    type={type}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

export default StatisticsTable;
