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

  const dynamicDetailConfig = observedTimeInfoProperty
    ? { params: { timeproperty: `${observedTimeInfoProperty}.observedAt` } }
    : undefined;

  const staticDetailConfig = param.contextId
    ? { headers: { Link: `<${param.contextId}>` } }
    : undefined;

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
