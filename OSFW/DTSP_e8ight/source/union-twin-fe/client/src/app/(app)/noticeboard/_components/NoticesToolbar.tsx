'use client';

import { Button } from '@e8ight/ui/components/ui/button';
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
import { PenSquare, Search } from 'lucide-react';
import Link from 'next/link';

import { useCurrentUser } from '@/hooks/useCurrentUser';

import type { NoticeSortBy } from '@/types/noticeboard';

type SortValue =
  'createdAt:DESC' | 'createdAt:ASC' | 'viewCount:DESC' | 'title:ASC';

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'createdAt:DESC', label: '최신순' },
  { value: 'createdAt:ASC', label: '오래된순' },
  { value: 'viewCount:DESC', label: '조회순' },
  { value: 'title:ASC', label: '가나다순' },
];

interface NoticesToolbarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  sortBy: NoticeSortBy;
  sortOrder: 'ASC' | 'DESC';
  onSortChange: (sortBy: NoticeSortBy, sortOrder: 'ASC' | 'DESC') => void;
}

export function NoticesToolbar({
  keyword,
  onKeywordChange,
  sortBy,
  sortOrder,
  onSortChange,
}: NoticesToolbarProps) {
  const { isAdmin } = useCurrentUser();

  const sortValue = `${sortBy}:${sortOrder}` as SortValue;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <InputGroup className="h-10 w-full sm:max-w-sm">
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="제목 또는 내용으로 검색"
          className="text-sm"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
      </InputGroup>

      <div className="flex items-center gap-2">
        <Select
          value={sortValue}
          onValueChange={(v) => {
            const [next, order] = (v as SortValue).split(':') as [
              NoticeSortBy,
              'ASC' | 'DESC',
            ];
            onSortChange(next, order);
          }}
        >
          <SelectTrigger className="h-10 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin ? (
          <Button asChild className="h-10">
            <Link href="/noticeboard/write">
              <PenSquare className="size-4" />
              작성
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
