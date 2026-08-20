import { useEffect, useRef } from 'react';

import { useIntersectionObserver } from './useIntersectionObserver';

interface UseInfiniteScrollProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  rootMargin?: number;
}

/**
 * 무한 스크롤을 위한 커스텀 훅
 *
 * Intersection Observer를 활용한 무한 스크롤 기능을 제공합니다.
 * 사용자가 스크롤을 맨 아래로 내리거나, 컨텐츠가 부족해서 스크롤바가 없을 때
 * 자동으로 다음 페이지를 가져옵니다.
 *
 * @param hasNextPage - 다음 페이지가 있는지 여부
 * @param isFetchingNextPage - 현재 다음 페이지를 가져오는 중인지 여부
 * @param fetchNextPage - 다음 페이지를 가져오는 함수
 * @param rootMargin - 요소가 화면에 보이기 전에 미리 로드하기 위해 root영역을 확장
 * @returns 스크롤 가능한 컨테이너에 연결할 ref와 센티넬 요소 ref
 *
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = 100,
}: UseInfiniteScrollProps) {
  const containerRef = useRef<T>(null);
  const isCallingRef = useRef(false); // NOTE : 중복 호출 방지를 위한 플래그 (로딩이 끝나기 전에 sentinel 위치가 바뀌어 중복 호출되는 것을 방지)

  const { isIntersecting, registerObserver: sentinelRef } =
    useIntersectionObserver<HTMLElement>(
      `${rootMargin}px`,
      containerRef.current,
    );

  useEffect(() => {
    if (
      isIntersecting &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isCallingRef.current
    ) {
      isCallingRef.current = true;
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!isFetchingNextPage) {
      isCallingRef.current = false;
    }
  }, [isFetchingNextPage]);

  return {
    containerRef,
    sentinelRef,
  };
}
