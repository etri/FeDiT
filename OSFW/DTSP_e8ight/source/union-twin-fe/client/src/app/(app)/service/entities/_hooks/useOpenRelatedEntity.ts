import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useSwitchEntityTab } from '@/app/(app)/service/entities/_hooks/useActiveEntityTab';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import { entityPath } from '@/app/(app)/service/entities/_utils/paths';
import { INIT_ENTITY_SEARCH_INFO } from '@/app/(app)/service/entities/_utils/searchInfo';

import type { EntityTabType } from '@/app/(app)/service/entities/_types/entity';

function getModelIdFromEntityId(entityId: string) {
  const [urn, ngsiLd, modelId] = entityId.split(':');

  if (urn !== 'urn' || ngsiLd !== 'ngsi-ld' || !modelId) {
    return null;
  }

  return modelId;
}

export function useOpenRelatedEntity({
  appendEntityTabList,
}: {
  appendEntityTabList: (newEntityTab: EntityTabType) => void;
}) {
  const router = useRouter();
  const param = useEntityParams();
  const switchEntityTab = useSwitchEntityTab();

  return useCallback(
    (entityId: string) => {
      if (!param.contextId) {
        return;
      }

      const modelId = getModelIdFromEntityId(entityId) ?? param.modelId;
      if (!modelId) {
        return;
      }

      const newEntityTab: EntityTabType = {
        title: entityId,
        contextId: param.contextId,
        modelId,
        entityId,
        detailId: entityId,
        searchInfo: INIT_ENTITY_SEARCH_INFO,
      };

      switchEntityTab(newEntityTab);
      appendEntityTabList(newEntityTab);
      router.push(entityPath(param.contextId, modelId, entityId));
    },
    [
      appendEntityTabList,
      router,
      param.contextId,
      param.modelId,
      switchEntityTab,
    ],
  );
}
