'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@e8ight/ui/components/ui/dropdown-menu';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@e8ight/ui/components/ui/tabs';
import { useSuspenseQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import {
  Eye,
  Globe,
  GlobeLock,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Search,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  noticeQueries,
  useDeleteNoticeMutation,
  usePinNoticeMutation,
  usePublishNoticeMutation,
} from '@/apis/notices';
import { SortableTableHead } from '@/app/(app)/admin/_components/SortableTableHead';
import { PaginationFooter } from '@/components/common/PaginationFooter';
import {
  useNoticesPageParam,
  useNoticesSortParam,
  useNoticesStatusParam,
} from '@/hooks/useNoticesSearchParams';

import type { Notice, NoticeSortBy, NoticeStatus } from '@/types/noticeboard';

const STATUS_TABS: { label: string; value: NoticeStatus }[] = [
  { label: '전체', value: 'all' },
  { label: '공개', value: 'published' },
  { label: '비공개', value: 'unpublished' },
];

const EMPTY_MESSAGES: Record<
  NoticeStatus,
  { title: string; description: string }
> = {
  all: {
    title: '게시글이 없습니다',
    description: '새 공지사항을 작성해보세요',
  },
  published: {
    title: '공개된 게시글이 없습니다',
    description: '게시글을 공개 상태로 변경해보세요',
  },
  unpublished: {
    title: '비공개 게시글이 없습니다',
    description: '모든 게시글이 공개 상태입니다',
  },
};

export default function NoticesAdminContent() {
  const router = useRouter();
  const { page, size, setPage, setSize } = useNoticesPageParam();
  const { status, setStatus } = useNoticesStatusParam();
  const { sortBy, sortOrder, toggleSort } = useNoticesSortParam();
  const [keyword, setKeyword] = useState('');

  const params = useMemo(
    () => ({ page, size, status, sortBy, sortOrder }),
    [page, size, status, sortBy, sortOrder],
  );
  const deferredParams = useDeferredValue(params);
  const isStale = params !== deferredParams;

  const { data: noticesData } = useSuspenseQuery(
    noticeQueries.adminList(deferredParams),
  );

  const deleteMutation = useDeleteNoticeMutation();
  const publishMutation = usePublishNoticeMutation();
  const pinMutation = usePinNoticeMutation();

  async function handleDelete(notice: Notice) {
    const confirmed = await openConfirmDialog({
      title: '게시글 삭제',
      message: `"${notice.title}" 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
    });

    if (confirmed) {
      deleteMutation.mutate(notice.id);
    }
  }

  const notices = noticesData.data;
  const meta = noticesData.meta;
  const emptyMsg = EMPTY_MESSAGES[status];

  const rows = notices
    .map((notice, index) => ({ notice, index }))
    .filter(
      ({ notice }) =>
        !keyword || notice.title.toLowerCase().includes(keyword.toLowerCase()),
    );

  return (
    <Tabs
      value={status}
      onValueChange={(v) => setStatus(v as NoticeStatus)}
      className="flex min-h-0 flex-1 flex-col gap-6"
    >
      <TabsList variant="line">
        {STATUS_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <InputGroup className="max-w-sm">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="현재 페이지 내 제목 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </InputGroup>

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col transition-opacity',
          isStale && 'pointer-events-none opacity-50',
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border [&>[data-slot=table-container]]:min-h-0 [&>[data-slot=table-container]]:flex-1 [&>[data-slot=table-container]]:overflow-y-auto">
          <Table>
            <TableHeader className="bg-background sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-16 text-center">번호</TableHead>
                <SortableTableHead
                  label="상태"
                  column="isPublished"
                  sortable
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onToggleSort={(col) => toggleSort(col as NoticeSortBy)}
                  className="w-28"
                />
                <SortableTableHead
                  label="제목"
                  column="title"
                  sortable
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onToggleSort={(col) => toggleSort(col as NoticeSortBy)}
                />
                <SortableTableHead
                  label="작성일"
                  column="createdAt"
                  sortable
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onToggleSort={(col) => toggleSort(col as NoticeSortBy)}
                  className="w-32"
                />
                <SortableTableHead
                  label="조회"
                  column="viewCount"
                  sortable
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onToggleSort={(col) => toggleSort(col as NoticeSortBy)}
                  className="w-20"
                />
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-60">
                    <Empty>
                      <EmptyMedia variant="icon">
                        <Megaphone />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>{emptyMsg.title}</EmptyTitle>
                        <EmptyDescription>
                          {emptyMsg.description}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ notice, index }) => (
                  <TableRow
                    key={notice.id}
                    className={cn(
                      notice.isPinned && 'bg-amber-50/60 dark:bg-amber-950/20',
                      !notice.isPublished && !notice.isPinned && 'bg-muted/40',
                    )}
                  >
                    <TableCell className="text-center">
                      {notice.isPinned ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                        >
                          <Pin className="size-3" />
                          공지
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {meta.total - (page - 1) * size - index}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={notice.isPublished ? 'secondary' : 'outline'}
                        className={cn(
                          !notice.isPublished && 'text-muted-foreground',
                        )}
                      >
                        {notice.isPublished ? '공개' : '비공개'}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'min-w-48 text-sm font-bold whitespace-normal',
                        !notice.isPublished && 'text-muted-foreground',
                      )}
                    >
                      {notice.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {notice.viewCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/noticeboard/${notice.id}/edit`)
                            }
                          >
                            <Pencil className="size-4" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => publishMutation.mutate(notice.id)}
                          >
                            {notice.isPublished ? (
                              <GlobeLock className="size-4" />
                            ) : (
                              <Globe className="size-4" />
                            )}
                            {notice.isPublished
                              ? '비공개로 전환'
                              : '공개로 전환'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => pinMutation.mutate(notice.id)}
                          >
                            {notice.isPinned ? (
                              <PinOff className="size-4" />
                            ) : (
                              <Pin className="size-4" />
                            )}
                            {notice.isPinned ? '고정 해제' : '상단 고정'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(notice)}
                          >
                            <Trash2 className="size-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {meta.totalPages > 0 && (
        <PaginationFooter
          meta={meta}
          page={page}
          size={size}
          onPageChange={setPage}
          onSizeChange={setSize}
          className="gap-3"
          controlsClassName="gap-4"
        />
      )}
    </Tabs>
  );
}
