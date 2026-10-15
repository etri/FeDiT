import { useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { DatePicker, ko } from '@e8ight/ui/components/ui/date-picker';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@e8ight/ui/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { AlertTriangle, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import { overlay } from 'overlay-kit';

import { statisticsQueries } from '@/apis/statistics';
import { RuntimeLogView } from '@/app/(app)/service/agents/_components/RuntimeLogView';
import { formatKstDateTime } from '@/lib/date';

import type { LogResponse } from '@/types/common';
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';

const FAIL_LOG_REFRESH_INTERVAL_MS = 30_000;

type LogQueryOptions<TKey extends QueryKey> = UseQueryOptions<
  LogResponse,
  Error,
  LogResponse,
  TKey
>;

function RefreshButton({
  isFetching,
  onRefresh,
}: {
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isFetching}
    >
      {isFetching ? <Spinner className="size-4" /> : <RefreshCw />}
      Refresh
    </Button>
  );
}

function LogDialogBody<TKey extends QueryKey>({
  options,
}: {
  options: LogQueryOptions<TKey>;
}) {
  const { data, isPending, isError, isFetching, refetch } = useQuery(options);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          서버에서 수집한 최근 런타임 로그 (마지막 100줄
          {data ? ` · ${data.endLineNum.toLocaleString()}줄까지` : ''})
        </p>
        <RefreshButton
          isFetching={isFetching}
          onRefresh={() => void refetch()}
        />
      </div>
      <div className="border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
        {isPending ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Spinner className="text-muted-foreground size-6" />
          </div>
        ) : isError ? (
          <Empty className="min-h-[400px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertTriangle className="text-destructive" />
              </EmptyMedia>
              <EmptyTitle>로그를 불러오지 못했습니다</EmptyTitle>
              <EmptyDescription>
                잠시 후 Refresh를 눌러 다시 시도해 주세요.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : data.log.trim() === '' ? (
          <Empty className="min-h-[400px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>출력된 로그가 없습니다</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <RuntimeLogView log={data.log} />
        )}
      </div>
    </div>
  );
}

function FailLogPanel({ modelType }: { modelType: string }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const date = dayjs(selectedDate).format('YYYY-MM-DD');
  const isToday = date === dayjs().format('YYYY-MM-DD');
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    ...statisticsQueries.failures({ date, dataModel: modelType }),
    refetchInterval: isToday ? FAIL_LOG_REFRESH_INTERVAL_MS : false,
  });

  const records = data?.records ?? [];
  const totalData = data?.totalData ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DatePicker
            size="sm"
            selected={selectedDate}
            onSelect={(next) => next && setSelectedDate(next)}
            formatValue={() => date}
            locale={ko}
            calendarProps={{ disabled: { after: new Date() } }}
          />
          <p className="text-muted-foreground text-xs">
            {records.length.toLocaleString()} / {totalData.toLocaleString()}건
            {isToday ? ' · 30초마다 자동 갱신' : ''}
          </p>
        </div>
        <RefreshButton
          isFetching={isFetching}
          onRefresh={() => void refetch()}
        />
      </div>
      <div className="border-border min-h-0 flex-1 overflow-auto rounded-md border [&_[data-slot=table-container]]:overflow-visible">
        {isPending ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Spinner className="text-muted-foreground size-6" />
          </div>
        ) : isError ? (
          <Empty className="min-h-[400px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertTriangle className="text-destructive" />
              </EmptyMedia>
              <EmptyTitle>수집 실패 로그를 불러오지 못했습니다</EmptyTitle>
              <EmptyDescription>
                잠시 후 Refresh를 눌러 다시 시도해 주세요.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : records.length === 0 ? (
          <Empty className="min-h-[400px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheck />
              </EmptyMedia>
              <EmptyTitle>수집 실패가 없습니다</EmptyTitle>
              <EmptyDescription>
                {modelType} 모델의 {date} 수집 실패 내역이 없습니다.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Table className="table-fixed">
              <TableHeader className="bg-muted/40 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground h-10 w-[20%] px-4 text-xs">
                    Time (KST)
                  </TableHead>
                  <TableHead className="text-muted-foreground h-10 w-[44%] px-4 text-xs">
                    Entity ID
                  </TableHead>
                  <TableHead className="text-muted-foreground h-10 w-[36%] px-4 text-xs">
                    Cause
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow
                    key={`${record.entity?._id?.id ?? 'unknown'}-${index}`}
                  >
                    <TableCell className="text-muted-foreground px-4 py-3 font-mono text-xs">
                      {record.entity?.creDate
                        ? formatKstDateTime(record.entity.creDate)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-foreground px-4 py-3 text-sm wrap-anywhere whitespace-normal">
                      {record.entity?._id?.id ?? '-'}
                    </TableCell>
                    <TableCell className="text-destructive px-4 py-3 text-sm wrap-anywhere whitespace-normal">
                      {record.cause ?? record.result ?? '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </div>
  );
}

interface OpenLogDialogParams<TKey extends QueryKey> {
  title: string;
  modelTypes: string[];
  options: LogQueryOptions<TKey>;
  failLogModelType?: string;
}

export function openLogDialog<TKey extends QueryKey>({
  title,
  modelTypes,
  options,
  failLogModelType,
}: OpenLogDialogParams<TKey>) {
  const uniqueModelTypes = [...new Set(modelTypes)];

  return overlay.openAsync<void>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{title}</DialogTitle>
            {uniqueModelTypes.length === 0 ? (
              <Badge variant="outline">No model type</Badge>
            ) : (
              uniqueModelTypes.map((modelType) => (
                <Badge
                  key={modelType}
                  variant="secondary"
                  className="max-w-full"
                  title={modelType}
                >
                  <span className="truncate">{modelType}</span>
                </Badge>
              ))
            )}
          </div>
          <DialogDescription>
            Runtime and collection logs for this component.
          </DialogDescription>
        </DialogHeader>
        {failLogModelType ? (
          <Tabs
            defaultValue="runtime"
            className="flex min-h-0 flex-1 flex-col gap-2"
          >
            <TabsList className="grid w-full max-w-[320px] grid-cols-2">
              <TabsTrigger value="runtime">Translator log</TabsTrigger>
              <TabsTrigger value="fail">Fail log</TabsTrigger>
            </TabsList>
            <TabsContent
              value="runtime"
              className="flex min-h-0 flex-1 flex-col"
            >
              <LogDialogBody options={options} />
            </TabsContent>
            <TabsContent value="fail" className="flex min-h-0 flex-1 flex-col">
              <FailLogPanel modelType={failLogModelType} />
            </TabsContent>
          </Tabs>
        ) : (
          <LogDialogBody options={options} />
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ));
}
