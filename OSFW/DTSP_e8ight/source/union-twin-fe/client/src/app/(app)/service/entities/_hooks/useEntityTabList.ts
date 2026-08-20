import { useCallback } from 'react';

import { useSetTreeHistory } from '@/app/(app)/service/entities/_hooks/useTreeHistory';
import { useEntityTabStore } from '@/app/(app)/service/entities/_stores/useEntityTabStore';

import type { EntityTabType } from '@/app/(app)/service/entities/_types/entity';

function useEntityTabList() {
  const entityTabList = useEntityTabStore((s) => s.tabs);
  const appendTab = useEntityTabStore((s) => s.appendTab);
  const removeTab = useEntityTabStore((s) => s.removeTab);

  const setTreeHistory = useSetTreeHistory();

  const append = useCallback(
    (newEntityTab: EntityTabType) => {
      appendTab(newEntityTab);
      setTreeHistory((prev) => {
        if (prev.some((el) => el.treeHistoryId === newEntityTab.detailId)) {
          return prev;
        }
        return [
          ...prev,
          {
            treeHistoryId: newEntityTab.detailId,
            treeHistory: {},
          },
        ];
      });
    },
    [appendTab, setTreeHistory],
  );

  const remove = useCallback(
    (entityDetailId: string) => {
      removeTab(entityDetailId);
      setTreeHistory((prev) =>
        prev.filter((el) => el.treeHistoryId !== entityDetailId),
      );
    },
    [removeTab, setTreeHistory],
  );

  return [entityTabList, { append, remove }] as const;
}

export default useEntityTabList;
