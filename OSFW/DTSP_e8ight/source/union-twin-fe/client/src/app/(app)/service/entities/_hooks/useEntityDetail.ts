import { useMemo } from 'react';

import { useSuspenseQuery } from '@tanstack/react-query';

import { entityQueries } from '@/apis/entity/entity.queries';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';

interface UseEntityDetailOptions {
  observedTimeInfoProperty?: string;
}

export function useEntityDetail({
  observedTimeInfoProperty,
}: UseEntityDetailOptions) {
  const param = useEntityParams();

  const dynamicDetailConfig = useMemo(() => {
    if (!observedTimeInfoProperty) {
      return undefined;
    }

    return {
      params: {
        timeproperty: `${observedTimeInfoProperty}.observedAt`,
      },
    };
  }, [observedTimeInfoProperty]);

  const staticDetailConfig = useMemo(() => {
    if (!param.contextId) {
      return undefined;
    }

    return {
      headers: {
        Link: `<${param.contextId}>`,
      },
    };
  }, [param.contextId]);

  const shouldReadHistoryDetail =
    param.historyId !== undefined && dynamicDetailConfig !== undefined;

  const { data: entityDetail } = useSuspenseQuery(
    entityQueries.detailByMode({
      isHistory: shouldReadHistoryDetail,
      entityId: param.entityId,
      detailConfig: staticDetailConfig,
      historyId: param.historyId,
      historyConfig: dynamicDetailConfig,
    }),
  );

  const dynamicDetail = 'observedAt' in entityDetail ? entityDetail : undefined;
  const staticDetail = 'observedAt' in entityDetail ? undefined : entityDetail;

  return { dynamicDetail, staticDetail };
}
