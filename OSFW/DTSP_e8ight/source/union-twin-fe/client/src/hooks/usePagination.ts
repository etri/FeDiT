import { useCallback, useEffect, useRef, useState } from 'react';

export function getPageItems(
  current: number,
  total: number,
): Array<number | 'ellipsis'> {
  if (total < 1) {
    return [];
  }

  const range: number[] = [];
  let last: number | undefined;

  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      range.push(i);
    }
  }

  const out: Array<number | 'ellipsis'> = [];

  for (const i of range) {
    if (last != null) {
      if (i - last === 2) {
        out.push(last + 1);
      } else if (i - last > 2) {
        out.push('ellipsis');
      }
    }
    out.push(i);
    last = i;
  }

  return out;
}

export interface UsePaginationResult {
  page: number;
  pageItems: Array<number | 'ellipsis'>;
  canGoBackward: boolean;
  canGoForward: boolean;
  goToPage: (page: number) => void;
  goToFirst: () => void;
  goToLast: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
}

export function usePagination(
  totalPages: number,
  resetKey = '',
): UsePaginationResult {
  const [requestedPage, setPage] = useState(1);
  const prevKeyRef = useRef(resetKey);

  useEffect(() => {
    if (prevKeyRef.current === resetKey) {
      return;
    }
    prevKeyRef.current = resetKey;
    setPage(1);
  }, [resetKey]);

  const lastPage = Math.max(totalPages, 1);
  const page = Math.min(requestedPage, lastPage);

  return {
    page,
    pageItems: getPageItems(page, totalPages),
    canGoBackward: page > 1,
    canGoForward: totalPages >= 1 && page < totalPages,
    goToPage: useCallback((p: number) => setPage(Math.max(p, 1)), []),
    goToFirst: () => setPage(1),
    goToLast: () => setPage(lastPage),
    goToPrevious: () => setPage(Math.max(page - 1, 1)),
    goToNext: () => setPage(Math.min(page + 1, lastPage)),
  };
}
