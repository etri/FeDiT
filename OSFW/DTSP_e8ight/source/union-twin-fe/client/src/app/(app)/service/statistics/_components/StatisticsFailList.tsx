import { useState } from 'react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@e8ight/ui/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { cn } from 'cn';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { failRecordTimeValue, statisticsQueries } from '@/apis/statistics';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import { liveRefetchInterval } from '@/app/(app)/service/statistics/_utils';
import { formatKstDateTime } from '@/lib/date';

import type { FailEntityRecord } from '@/apis/statistics';

const ALL_CAUSES = 'all';

const causeOf = (record: FailEntityRecord) =>
  record.cause ?? record.result ?? '';

const timeOf = (record: FailEntityRecord) => {
  const creDate = record.entity?.creDate;
  return creDate ? formatKstDateTime(creDate) : '-';
};

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
});

const columnHelper = createColumnHelper<typeof features, FailEntityRecord>();

const columns = columnHelper.columns([
  columnHelper.accessor((record) => failRecordTimeValue(record), {
    id: 'time',
    header: 'Time (KST)',
    sortDescFirst: true,
  }),
  columnHelper.accessor((record) => record.entity?._id?.id ?? '', {
    id: 'entityId',
    header: 'Entity ID',
  }),
  columnHelper.accessor((record) => record.entity?._id?.type ?? '', {
    id: 'type',
    header: 'Type',
  }),
  columnHelper.accessor(causeOf, {
    id: 'cause',
    header: 'Cause',
  }),
]);

function StatisticsFailList() {
  const date = useStatisticsStore((s) => s.currentDate);
  const selectedItem = useStatisticsStore(useShallow((s) => s.selectedItems));
  const [search, setSearch] = useState('');
  const [cause, setCause] = useState(ALL_CAUSES);

  const { data } = useSuspenseQuery({
    ...statisticsQueries.failures({
      date,
      dataModel: selectedItem.dataModel || undefined,
      provider: selectedItem.provider || undefined,
    }),
    refetchInterval: liveRefetchInterval(date),
  });

  const { records, totalData } = data;

  const causes = [...new Set(records.map(causeOf).filter(Boolean))];
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = records.filter((record) => {
    if (cause !== ALL_CAUSES && causeOf(record) !== cause) {
      return false;
    }
    if (normalizedSearch === '') {
      return true;
    }
    return (record.entity?._id?.id ?? '')
      .toLowerCase()
      .includes(normalizedSearch);
  });
  const isFiltered = cause !== ALL_CAUSES || normalizedSearch !== '';

  const table = useTable({
    features,
    columns,
    data: filtered,
    initialState: { sorting: [{ id: 'time', desc: true }] },
    enableSortingRemoval: false,
    enableMultiSort: false,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-border flex flex-none flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-foreground text-sm font-bold tracking-[.03em]">
            Failure log
          </h3>
          <InputGroup className="h-8 w-[200px]">
            <InputGroupInput
              placeholder="Search entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <Search className="text-muted-foreground size-3.5" />
            </InputGroupAddon>
          </InputGroup>
          <Select value={cause} onValueChange={setCause}>
            <SelectTrigger size="sm" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CAUSES}>All causes</SelectItem>
              {causes.map((causeOption) => (
                <SelectItem key={causeOption} value={causeOption}>
                  {causeOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground text-xs">
          {records.length.toLocaleString()} / {totalData.toLocaleString()}{' '}
          records
          {isFiltered && ` · ${filtered.length.toLocaleString()} matches`}
        </p>
      </div>

      {totalData === 0 ? (
        <Empty className="flex-1 border-0 bg-transparent">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldCheck className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No failures</EmptyTitle>
            <EmptyDescription>
              Every entity collected for this selection passed validation.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto [&_[data-slot=table-container]]:overflow-visible">
          <Table className="table-fixed">
            <TableHeader className="bg-muted/40 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                {table.getFlatHeaders().map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : 'none'
                      }
                      className={cn(
                        'text-muted-foreground h-10 px-4 text-xs',
                        header.id === 'time' && 'w-[14%]',
                        header.id === 'entityId' && 'w-[34%]',
                        header.id === 'type' && 'w-[18%]',
                        header.id === 'cause' && 'w-[34%]',
                      )}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1"
                      >
                        <table.FlexRender header={header} />
                        {sorted === 'desc' ? (
                          <ArrowDown className="size-3" />
                        ) : sorted === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground px-4 py-6 text-center text-sm"
                  >
                    No loaded records match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const record = row.original;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground px-4 py-3 font-mono text-xs">
                        {timeOf(record)}
                      </TableCell>
                      <TableCell className="text-foreground px-4 py-3 text-sm wrap-anywhere whitespace-normal">
                        {record.entity?._id?.id ?? '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground px-4 py-3 text-sm wrap-anywhere whitespace-normal">
                        {record.entity?._id?.type ?? '-'}
                      </TableCell>
                      <TableCell className="text-destructive px-4 py-3 text-sm wrap-anywhere whitespace-normal">
                        {causeOf(record) || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default StatisticsFailList;
