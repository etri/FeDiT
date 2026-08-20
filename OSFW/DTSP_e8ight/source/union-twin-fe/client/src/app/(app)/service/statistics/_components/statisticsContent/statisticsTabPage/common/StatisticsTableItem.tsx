import { TableCell, TableRow } from '@e8ight/ui/components/ui/table';
import { cn } from '@e8ight/ui/utils/cn';
import { useShallow } from 'zustand/react/shallow';

import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import { returnStatesByType } from '@/app/(app)/service/statistics/_utils';

import type { StatisticsSummary } from '@/app/(app)/service/statistics/_types';

function StatisticsTableItem({
  task,
  name,
  type,
}: {
  task: StatisticsSummary | null;
  name: string;
  type: string;
}) {
  const selectedItem = useStatisticsStore(useShallow((s) => s.selectedItems));
  const setSelectedItem = useStatisticsStore((s) => s.setSelectedItems);
  const toggleClickable = useStatisticsStore((s) => s.clickable);

  const keyByType = returnStatesByType(type)?.onClickState as
    keyof typeof selectedItem | undefined;
  const isSelected = keyByType ? name === selectedItem[keyByType] : false;
  const totalEntities = task?.totalEntities ?? 0;
  const successWidth =
    totalEntities > 0
      ? ((task?.successEntities ?? 0) / totalEntities) * 100
      : 0;
  const failWidth =
    totalEntities > 0 ? ((task?.failEntities ?? 0) / totalEntities) * 100 : 0;

  const handleOnClick = () => {
    if (!toggleClickable || !keyByType) {
      return;
    }

    setSelectedItem({
      ...selectedItem,
      [keyByType]: name,
      ...(keyByType === 'dataModel' && { provider: '' }),
    });
  };

  return (
    <TableRow
      data-state={isSelected ? 'selected' : undefined}
      className={cn(
        'data-[state=selected]:bg-primary/6 cursor-pointer transition-colors',
        !toggleClickable && 'cursor-default',
      )}
      onClick={handleOnClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOnClick();
        }
      }}
    >
      <TableCell className="px-4 py-3 wrap-anywhere whitespace-normal">
        <div className="flex flex-col gap-2">
          <span className="text-foreground text-sm leading-snug font-bold">
            {name}
          </span>
          {task && totalEntities > 0 && (
            <div className="bg-muted overflow-hidden rounded-full">
              <div className="flex h-1.5 w-full">
                <div
                  className="bg-primary"
                  style={{ width: `${successWidth}%` }}
                />
                <div
                  className="bg-destructive"
                  style={{ width: `${failWidth}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </TableCell>
      {task && (
        <>
          <TableCell className="text-primary px-4 py-3 text-right font-mono">
            {task.successEntities.toLocaleString()}
          </TableCell>
          <TableCell className="text-destructive px-4 py-3 text-right font-mono">
            {task.failEntities.toLocaleString()}
          </TableCell>
          <TableCell className="text-muted-foreground px-4 py-3 text-right font-mono font-medium">
            {task.totalEntities.toLocaleString()}
          </TableCell>
        </>
      )}
    </TableRow>
  );
}

export default StatisticsTableItem;
