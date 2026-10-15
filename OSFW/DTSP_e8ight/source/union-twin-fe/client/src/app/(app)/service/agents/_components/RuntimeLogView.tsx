import { useEffect, useRef, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
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
import { toast } from '@e8ight/ui/components/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@e8ight/ui/components/ui/toggle-group';
import { cn } from 'cn';
import { ChevronRight, Copy, Search, SearchX } from 'lucide-react';

import {
  isLevelAtLeast,
  parseRuntimeLog,
} from '@/app/(app)/service/agents/_utils/parseRuntimeLog';

import type {
  LogLevel,
  RuntimeLogEntry,
} from '@/app/(app)/service/agents/_utils/parseRuntimeLog';

type LevelFilter = 'all' | 'WARN' | 'ERROR';

const LEVEL_BADGE: Record<LogLevel, string> = {
  TRACE: 'bg-muted text-muted-foreground',
  DEBUG: 'bg-muted text-muted-foreground',
  INFO: 'bg-secondary text-secondary-foreground',
  WARN: 'bg-warning text-warning-foreground',
  ERROR: 'bg-destructive text-white',
  FATAL: 'bg-destructive text-white',
};

function matchesSearch(entry: RuntimeLogEntry, keyword: string) {
  if (keyword === '') return true;
  const haystack = [entry.logger, entry.message, ...entry.continuation]
    .join('\n')
    .toLowerCase();
  return haystack.includes(keyword);
}

interface RuntimeLogRowProps {
  entry: RuntimeLogEntry;
}

function RuntimeLogRow({ entry }: RuntimeLogRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasContinuation = entry.continuation.length > 0;

  return (
    <TableRow className="align-top">
      <TableCell
        className="text-muted-foreground px-3 py-2 font-mono text-xs whitespace-nowrap"
        title={entry.time ?? undefined}
      >
        {entry.time ? entry.time.slice(11) : '-'}
      </TableCell>
      <TableCell className="px-3 py-2">
        {entry.level ? (
          <Badge className={cn('font-mono', LEVEL_BADGE[entry.level])}>
            {entry.level}
          </Badge>
        ) : null}
      </TableCell>
      <TableCell
        className="text-muted-foreground max-w-0 truncate px-3 py-2 font-mono text-xs"
        title={entry.logger}
      >
        {entry.logger}
      </TableCell>
      <TableCell className="px-3 py-2 font-mono text-xs leading-5 break-all whitespace-pre-wrap">
        {entry.message}
        {hasContinuation && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="text-muted-foreground ml-1 h-5 gap-0.5 px-1"
              aria-expanded={expanded}
              onClick={() => setExpanded((prev) => !prev)}
            >
              <ChevronRight
                className={cn(
                  'size-3 transition-transform',
                  expanded && 'rotate-90',
                )}
              />
              +{entry.continuation.length} lines
            </Button>
            {expanded && (
              <pre className="bg-muted/40 mt-1 overflow-x-auto rounded-md p-2 whitespace-pre">
                {entry.continuation.join('\n')}
              </pre>
            )}
          </>
        )}
      </TableCell>
    </TableRow>
  );
}

interface RuntimeLogViewProps {
  log: string;
}

export function RuntimeLogView({ log }: RuntimeLogViewProps) {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = parseRuntimeLog(log);
  const keyword = search.trim().toLowerCase();
  const visible = entries.filter(
    (entry) =>
      (levelFilter === 'all' || isLevelAtLeast(entry.level, levelFilter)) &&
      matchesSearch(entry, keyword),
  );

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [log]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(log);
      toast.success('로그를 복사했습니다');
    } catch {
      toast.error('로그 복사에 실패했습니다');
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={levelFilter}
          onValueChange={(value) => {
            if (value) setLevelFilter(value as LevelFilter);
          }}
        >
          <ToggleGroupItem value="all" aria-label="전체 레벨">
            전체
          </ToggleGroupItem>
          <ToggleGroupItem value="WARN" aria-label="WARN 이상만">
            WARN+
          </ToggleGroupItem>
          <ToggleGroupItem value="ERROR" aria-label="ERROR만">
            ERROR
          </ToggleGroupItem>
        </ToggleGroup>
        <InputGroup className="h-8 w-[220px]">
          <InputGroupInput
            placeholder="로그 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <Search className="text-muted-foreground size-4" />
          </InputGroupAddon>
        </InputGroup>
        <span className="text-muted-foreground text-xs">
          {visible.length.toLocaleString()} / {entries.length.toLocaleString()}
          건
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => void handleCopy()}
        >
          <Copy />
          복사
        </Button>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        {visible.length === 0 ? (
          <Empty className="min-h-[400px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>조건에 맞는 로그가 없습니다</EmptyTitle>
              <EmptyDescription>
                레벨 필터나 검색어를 바꿔보세요.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table className="table-fixed">
            <TableHeader className="bg-muted/40 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground h-9 w-[110px] px-3 text-xs">
                  Time (KST)
                </TableHead>
                <TableHead className="text-muted-foreground h-9 w-[80px] px-3 text-xs">
                  Level
                </TableHead>
                <TableHead className="text-muted-foreground h-9 w-[22%] px-3 text-xs">
                  Logger
                </TableHead>
                <TableHead className="text-muted-foreground h-9 px-3 text-xs">
                  Message
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((entry) => (
                <RuntimeLogRow key={entry.id} entry={entry} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
