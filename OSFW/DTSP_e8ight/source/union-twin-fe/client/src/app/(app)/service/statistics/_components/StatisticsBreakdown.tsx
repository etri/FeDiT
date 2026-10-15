import { Card } from '@e8ight/ui/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { Tabs, TabsList, TabsTrigger } from '@e8ight/ui/components/ui/tabs';
import { useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { useShallow } from 'zustand/react/shallow';

import { statisticsQueries } from '@/apis/statistics';
import {
  useStatisticsStore,
  type StatisticsDimension,
} from '@/app/(app)/service/statistics/_stores';
import {
  isToday,
  liveRefetchInterval,
  toRate,
} from '@/app/(app)/service/statistics/_utils';

import type { StatisticsSummary } from '@/app/(app)/service/statistics/_types';

function BreakdownRow({
  active,
  name,
  onSelect,
  summary,
}: {
  active: boolean;
  name: string;
  onSelect: () => void;
  summary: StatisticsSummary;
}) {
  const successWidth = toRate(summary.successEntities, summary.totalEntities);
  const failWidth = toRate(summary.failEntities, summary.totalEntities);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-lg border border-transparent px-3 py-2.5 text-left',
        active ? 'border-primary/30 bg-primary/10' : 'hover:bg-muted/40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          title={name}
          className={cn(
            'text-foreground truncate text-sm',
            active && 'text-foreground text-sm font-bold',
          )}
        >
          {name}
        </span>
        <span className="text-muted-foreground font-mono text-xs">
          {summary.totalEntities.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {successWidth > 0 && (
          <span
            className="bg-primary rounded-full"
            style={{ width: `${successWidth}%` }}
          />
        )}
        {failWidth > 0 && (
          <span
            className="bg-destructive rounded-full"
            style={{ width: `${failWidth}%` }}
          />
        )}
      </div>
    </button>
  );
}

function StatisticsBreakdown() {
  const date = useStatisticsStore((s) => s.currentDate);
  const dimension = useStatisticsStore((s) => s.dimension);
  const setDimension = useStatisticsStore((s) => s.setDimension);
  const selectedItem = useStatisticsStore(useShallow((s) => s.selectedItems));
  const setSelectedItems = useStatisticsStore((s) => s.setSelectedItems);

  const { data } = useSuspenseQuery({
    ...statisticsQueries.table(dimension === 'providers' ? 'source' : 'model', {
      date,
      dataModel: selectedItem.dataModel,
    }),
    refetchInterval: liveRefetchInterval(date),
  });

  const rows = (Array.isArray(data.statistics) ? data.statistics : [])
    .filter((summary: StatisticsSummary) =>
      Boolean(summary.dataModel ?? summary.provider),
    )
    .sort(
      (a: StatisticsSummary, b: StatisticsSummary) =>
        b.totalEntities - a.totalEntities,
    );

  const activeName =
    dimension === 'providers' ? selectedItem.provider : selectedItem.dataModel;

  const rankLabel =
    dimension === 'providers'
      ? `Providers of ${selectedItem.dataModel}`
      : 'Ranked by total';

  const handleSelect = (name: string) =>
    setSelectedItems(
      dimension === 'providers'
        ? { dataModel: selectedItem.dataModel, provider: name }
        : { dataModel: name, provider: '' },
    );

  return (
    <Card className="border-border flex h-full min-h-0 flex-col overflow-hidden rounded-2xl">
      <div className="flex-none space-y-2 p-3 pb-1">
        <Tabs
          value={dimension}
          onValueChange={(value) => setDimension(value as StatisticsDimension)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="models">Model types</TabsTrigger>
            <TabsTrigger
              value="providers"
              disabled={selectedItem.dataModel === ''}
              title={
                selectedItem.dataModel === ''
                  ? 'Select a model first'
                  : undefined
              }
            >
              Providers
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center justify-between px-1">
          <span
            title={rankLabel}
            className="text-muted-foreground truncate text-xs"
          >
            {rankLabel}
          </span>
          <span className="text-muted-foreground text-xs">
            {rows.length} items
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <Empty className="border-0 bg-transparent">
            <EmptyHeader>
              <EmptyTitle>No statistics found</EmptyTitle>
              <EmptyDescription>
                {isToday(date)
                  ? "Today's per-model aggregates are not available yet. The failure log on the right is still live."
                  : 'There is no data to rank for the selected day.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3 pt-2">
          {rows.map((summary: StatisticsSummary) => {
            const name = summary.dataModel ?? summary.provider ?? '';
            return (
              <BreakdownRow
                key={name}
                name={name}
                summary={summary}
                active={name === activeName}
                onSelect={() => handleSelect(name)}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default StatisticsBreakdown;
