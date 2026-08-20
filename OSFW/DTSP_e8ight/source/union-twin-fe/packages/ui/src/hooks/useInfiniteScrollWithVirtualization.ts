import { useEffect, useRef } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';

interface UseInfiniteScrollWithVirtualizationProps<T> {
  items: T[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  estimateSize?: number;
  overscan?: number;
}

/**
 * 가상화와 무한 스크롤을 결합한 커스텀 훅
 *
 * @tanstack/react-virtual을 사용하여 대용량 리스트를 효율적으로 렌더링하면서
 * 스크롤이 끝에 가까워지면 자동으로 다음 페이지를 로드합니다.
 *
 * @param items - 가상화할 아이템 배열
 * @param hasNextPage - 다음 페이지가 있는지 여부
 * @param isFetchingNextPage - 현재 다음 페이지를 가져오는 중인지 여부
 * @param fetchNextPage - 다음 페이지를 가져오는 함수
 * @param estimateSize - 각 아이템의 예상 높이 (기본값: 200)
 * @param overscan - 화면 밖에서 미리 렌더링할 아이템 수 (기본값: 5)
 * @returns 가상화와 무한 스크롤에 필요한 refs와 함수들
 */
export function useInfiniteScrollWithVirtualization<T>({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  estimateSize = 200,
  overscan = 5,
}: UseInfiniteScrollWithVirtualizationProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 0,
    overscan,
  });

  useEffect(() => {
    // NOTE : 무한 스크롤 처리를 위해 마지막 아이템을 찾음
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    // NOTE : 마지막 아이템이 리스트의 마지막 아이템이고, 다음 페이지가 있고, 현재 페이지를 가져오는 중이 아니면 다음 페이지를 가져옴
    if (
      lastItem.index >= items.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    items.length,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);

  return {
    scrollRef,
    virtualizer,
  };
}
