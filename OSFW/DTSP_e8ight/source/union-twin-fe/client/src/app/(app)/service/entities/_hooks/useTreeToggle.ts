import { useEffect, useState } from 'react';

import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import {
  useSetTreeHistory,
  useTreeHistory,
} from '@/app/(app)/service/entities/_hooks/useTreeHistory';

export function useTreeToggle(initValue: boolean, treePath: string) {
  const [toggle, setToggle] = useState(initValue);
  const param = useEntityParams();
  const detailId = param.historyId ?? param.entityId ?? '';
  const treeHistory = useTreeHistory();
  const setTreeHistory = useSetTreeHistory();

  const currentTreeHistory = treeHistory.find(
    (el) => el.treeHistoryId === detailId,
  );

  useEffect(() => {
    setTreeHistory((prev) => {
      const current = prev.find((el) => el.treeHistoryId === detailId);
      if (!current || current.treeHistory[treePath] === toggle) return prev;

      return prev.map((item) => {
        if (item.treeHistoryId !== detailId) {
          return item;
        }

        return {
          ...item,
          treeHistory: { ...item.treeHistory, [treePath]: toggle },
        };
      });
    });
  }, [detailId, setTreeHistory, toggle, treePath]);

  useEffect(() => {
    if (currentTreeHistory !== undefined && treePath !== 'root') {
      if (currentTreeHistory.treeHistory[treePath] === undefined) {
        setTreeHistory((prev) =>
          prev.map((item) => {
            if (item.treeHistoryId !== detailId) {
              return item;
            }

            return {
              ...item,
              treeHistory: { ...item.treeHistory, [treePath]: initValue },
            };
          }),
        );
      }
      const historyToggleState =
        currentTreeHistory.treeHistory[treePath] ?? initValue;
      setToggle(historyToggleState);
    }
  }, [currentTreeHistory, detailId, initValue, setTreeHistory, treePath]);

  return [toggle, setToggle] as const;
}
