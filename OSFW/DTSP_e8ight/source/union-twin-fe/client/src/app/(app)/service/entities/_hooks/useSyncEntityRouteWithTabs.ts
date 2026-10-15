import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import useEntityTabList from '@/app/(app)/service/entities/_hooks/useEntityTabList';
import { useSwitchEntityTab } from '@/app/(app)/service/entities/_hooks/useSwitchEntityTab';
import {
  entityHistoryPath,
  entityPath,
} from '@/app/(app)/service/entities/_utils/paths';
import { INIT_ENTITY_SEARCH_INFO } from '@/app/(app)/service/entities/_utils/searchInfo';

import type { EntityTabType } from '@/app/(app)/service/entities/_types/entity';

export function useSyncEntityRouteWithTabs() {
  const [entityTabList, { append }] = useEntityTabList();
  const switchEntityTab = useSwitchEntityTab();
  const param = useEntityParams();
  const router = useRouter();

  useEffect(() => {
    const detailId = param.historyId ?? param.entityId;
    if (detailId === undefined) {
      return;
    }

    if (entityTabList.length === 0) {
      if (param.contextId && param.modelId && param.entityId) {
        const hydratedTab: EntityTabType = {
          title: param.entityId,
          contextId: param.contextId,
          modelId: param.modelId,
          entityId: param.entityId,
          detailId,
          historyId: param.historyId,
          searchInfo: INIT_ENTITY_SEARCH_INFO,
        };
        append(hydratedTab);
        switchEntityTab(hydratedTab);
      }
      return;
    }

    if (!entityTabList.some((el) => el.detailId === detailId)) {
      const endIdx = entityTabList.length - 1;
      const lastEntityTab = entityTabList[endIdx];

      const routeURL = lastEntityTab.historyId
        ? entityHistoryPath(
            lastEntityTab.contextId,
            lastEntityTab.modelId,
            lastEntityTab.entityId,
            lastEntityTab.historyId,
          )
        : entityPath(
            lastEntityTab.contextId,
            lastEntityTab.modelId,
            lastEntityTab.entityId,
          );

      router.push(routeURL);
      switchEntityTab(lastEntityTab);
    }
  }, [
    append,
    entityTabList,
    router,
    param.contextId,
    param.entityId,
    param.historyId,
    param.modelId,
    switchEntityTab,
  ]);
}
