import { useCallback } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  NOTICE_LIST_DEFAULTS,
  parseNoticeListParams,
} from '@/lib/notice-list-params';

import type { NoticeSortBy, NoticeStatus } from '@/types/noticeboard';

const DEFAULTS: Record<string, string | number> = NOTICE_LIST_DEFAULTS;

function useWriteParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (patch: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === DEFAULTS[key]) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      if (!('page' in patch)) params.delete('page');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );
}

export function useNoticesPageParam() {
  const searchParams = useSearchParams();
  const writeParams = useWriteParams();

  const { page, size } = parseNoticeListParams(searchParams);

  const setPage = useCallback(
    (next: number) => writeParams({ page: next }),
    [writeParams],
  );

  const setSize = useCallback(
    (next: number) => writeParams({ size: next }),
    [writeParams],
  );

  return { page, size, setPage, setSize };
}

export function useNoticesStatusParam() {
  const searchParams = useSearchParams();
  const writeParams = useWriteParams();

  const { status } = parseNoticeListParams(searchParams);

  const setStatus = useCallback(
    (next: NoticeStatus) => writeParams({ status: next }),
    [writeParams],
  );

  return { status, setStatus };
}

export function useNoticesSortParam() {
  const searchParams = useSearchParams();
  const writeParams = useWriteParams();

  const { sortBy, sortOrder } = parseNoticeListParams(searchParams);

  const setSort = useCallback(
    (nextSortBy: NoticeSortBy, nextSortOrder: 'ASC' | 'DESC') =>
      writeParams({ sortBy: nextSortBy, sortOrder: nextSortOrder }),
    [writeParams],
  );

  const toggleSort = useCallback(
    (column: NoticeSortBy) => {
      const nextSortOrder: 'ASC' | 'DESC' =
        sortBy === column && sortOrder === 'ASC' ? 'DESC' : 'ASC';
      setSort(
        column,
        sortBy === column ? nextSortOrder : NOTICE_LIST_DEFAULTS.sortOrder,
      );
    },
    [sortBy, sortOrder, setSort],
  );

  return { sortBy, sortOrder, toggleSort, setSort };
}
