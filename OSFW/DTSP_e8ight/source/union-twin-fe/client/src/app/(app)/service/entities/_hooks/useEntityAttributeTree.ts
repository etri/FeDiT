import { useCallback, useEffect, useMemo, useState } from 'react';

import { mapValues } from 'es-toolkit';

import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import { useSetTreeHistory } from '@/app/(app)/service/entities/_hooks/useTreeHistory';
import { generateTreeListJson } from '@/app/(app)/service/entities/_utils/entityTree';
import { convertFullDateTimeFromString } from '@/lib/date';

import type {
  EntityDetailType,
  EntityHistoryDetailType,
} from '@/apis/entity/entity.types';
import type { EntityAttributeSelection } from '@/app/(app)/service/entities/_types/entityAttribute';
import type { TreeJsonType } from '@/app/(app)/service/entities/_types/entityTree';

interface UseEntityAttributeTreeOptions {
  dynamicDetail: EntityHistoryDetailType | undefined;
  staticDetail: EntityDetailType | undefined;
}

export function useEntityAttributeTree({
  dynamicDetail,
  staticDetail,
}: UseEntityAttributeTreeOptions) {
  const param = useEntityParams();
  const setTreeHistory = useSetTreeHistory();
  const detailId = param.historyId ?? param.entityId;

  const [selectedAttribute, setSelectedAttribute] = useState<
    EntityAttributeSelection | undefined
  >(undefined);

  const detail = dynamicDetail ?? staticDetail;
  const jsonForTreeList = useMemo<TreeJsonType>(
    () => (detail ? generateTreeListJson(detail.entity) : {}),
    [detail],
  );
  const currentEntityPath = dynamicDetail
    ? [
        dynamicDetail.entity.id,
        convertFullDateTimeFromString(dynamicDetail.observedAt),
      ]
    : staticDetail
      ? [staticDetail.entity.id]
      : [];

  const handleAttributeSelect = useCallback(
    (selection: EntityAttributeSelection) => {
      setTreeHistory((prev) =>
        prev.map((item) => {
          if (item.treeHistoryId !== detailId) {
            return item;
          }

          const updatedHistory = { ...item.treeHistory };
          let currentTreePath = 'root';
          updatedHistory[currentTreePath] = true;
          selection.path.forEach((segment) => {
            currentTreePath = `${currentTreePath}/${segment}`;
            updatedHistory[currentTreePath] = true;
          });

          return { ...item, treeHistory: updatedHistory };
        }),
      );

      setSelectedAttribute(selection);
    },
    [detailId, setTreeHistory],
  );

  useEffect(() => {
    const firstAttribute = jsonForTreeList[0]?.[0];

    if (!firstAttribute) {
      setSelectedAttribute(undefined);
      return;
    }

    handleAttributeSelect({
      depth: 0,
      item: firstAttribute,
      path: [firstAttribute.target],
      treePath: `root/${firstAttribute.target}`,
    });
  }, [detailId, handleAttributeSelect, jsonForTreeList]);

  const foldAllHandler = (toggle: boolean) => {
    setTreeHistory((prev) =>
      prev.map((item) => {
        if (item.treeHistoryId !== detailId) {
          return item;
        }

        return {
          ...item,
          treeHistory: mapValues(item.treeHistory, () => toggle),
        };
      }),
    );
  };

  return {
    jsonForTreeList,
    currentEntityPath,
    selectedAttribute,
    handleAttributeSelect,
    foldAllHandler,
  };
}
