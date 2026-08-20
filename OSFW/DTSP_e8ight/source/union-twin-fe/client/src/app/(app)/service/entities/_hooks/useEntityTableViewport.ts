import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

import {
  ENTITY_PAGE_LIMIT_BUFFER_ROWS,
  ENTITY_ROW_HEIGHT_PX,
  MIN_ENTITY_PAGE_LIMIT,
} from '@/app/(app)/service/entities/_constants/entity';

import type { ModelInfoReturnTypeForEntity } from '@/app/(app)/service/entities/_types/entity';

export function useEntityTableViewport(
  containerRef: RefObject<HTMLDivElement | null>,
  modelInfo: ModelInfoReturnTypeForEntity | undefined,
  limitKey: string,
  scrollKey: string,
) {
  const [pageLimit, setPageLimit] = useState(0);

  useEffect(() => {
    if (containerRef.current === null || modelInfo === undefined) {
      return;
    }

    const nextPageLimit = Math.max(
      MIN_ENTITY_PAGE_LIMIT,
      Math.round(containerRef.current.offsetHeight / ENTITY_ROW_HEIGHT_PX) +
        ENTITY_PAGE_LIMIT_BUFFER_ROWS,
    );

    setPageLimit((prev) => (prev === nextPageLimit ? prev : nextPageLimit));
  }, [containerRef, modelInfo, limitKey]);

  useEffect(() => {
    if (containerRef.current === null) {
      return;
    }

    containerRef.current.scroll({ top: 0 });
  }, [containerRef, scrollKey]);

  return pageLimit;
}
