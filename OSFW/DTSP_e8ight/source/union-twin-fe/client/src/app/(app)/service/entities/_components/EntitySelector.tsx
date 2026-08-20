import { useEffect, useMemo, useRef } from 'react';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { modelQueries } from '@/apis/model';
import EntityHistory from '@/app/(app)/service/entities/_components/EntityHistory';
import EntityList from '@/app/(app)/service/entities/_components/EntityList';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import { useEntityTabStore } from '@/app/(app)/service/entities/_stores/useEntityTabStore';

import type { CriteriaInfoTypeList, ValueType } from '@/apis/entity';
import type {
  EntityTabType,
  ModelInfoReturnTypeForEntity,
} from '@/app/(app)/service/entities/_types/entity';

interface IProps {
  appendEntityTabList: (newEntityTab: EntityTabType) => void;
}

function EntitySelector({ appendEntityTabList }: IProps) {
  const router = useRouter();
  const { contextId, modelId, entityId, historyId } = useEntityParams();

  const resetSearchInfoForStatic = useEntityTabStore(
    (s) => s.resetSearchInfoForStatic,
  );

  const prevModelKeyRef = useRef('');
  useEffect(() => {
    const modelKey = `${contextId ?? ''}:${modelId ?? ''}`;
    if (prevModelKeyRef.current && prevModelKeyRef.current !== modelKey) {
      resetSearchInfoForStatic();
    }
    prevModelKeyRef.current = modelKey;
  }, [contextId, modelId, resetSearchInfoForStatic]);

  const showEntityList = () => {
    if (!contextId || !modelId) return;
    router.push(
      `/service/entities/${encodeURIComponent(contextId)}/${modelId}`,
    );
  };

  const { data: modelDetail } = useSuspenseQuery(modelQueries.detail(modelId));

  const modelInfoByMode = useMemo(() => {
    const { isDynamic, observation, attributeNames, attributes } = modelDetail;

    const buildModelInfo = (
      isHistory: boolean,
    ): ModelInfoReturnTypeForEntity => {
      const searchCriteriaInfoList: CriteriaInfoTypeList = [];

      if (!isHistory) {
        searchCriteriaInfoList.push({
          criteria: '_id.id',
          valueType: 'String',
          type: undefined,
        });
        searchCriteriaInfoList.push({
          criteria: '_id.servicePath',
          valueType: 'String',
          type: undefined,
        });
      } else {
        searchCriteriaInfoList.push({
          criteria: `${observation[0]}.observedAt`,
          valueType: 'DateTime',
          type: undefined,
        });
      }

      Object.keys(attributeNames).forEach((attribute) => {
        searchCriteriaInfoList.push({
          criteria: attribute,
          valueType: attributes[attribute].valueType as ValueType,
          type: attributes[attribute].type as
            'Property' | 'Relationship' | 'Geoproperty' | undefined,
        });
      });

      return {
        isDynamic,
        timePropertyList: observation,
        searchCriteriaInfoList,
      };
    };

    return {
      list: buildModelInfo(false),
      history: buildModelInfo(true),
    } as const;
  }, [modelDetail]);

  const isDynamicModel = modelDetail.isDynamic;
  const isEntityHistory =
    historyId !== undefined || (isDynamicModel && Boolean(entityId));
  const targetEntityId = entityId ?? '';

  const hasModelSelection = Boolean(contextId) && Boolean(modelId);

  if (!hasModelSelection) {
    return (
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
        <div className="bg-background flex min-h-0 w-full flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        {isEntityHistory ? (
          <EntityHistory
            targetEntityId={targetEntityId}
            modelInfo={modelInfoByMode.history}
            showEntityList={showEntityList}
            appendEntityTabList={appendEntityTabList}
          />
        ) : (
          <EntityList
            modelInfo={modelInfoByMode.list}
            appendEntityTabList={appendEntityTabList}
          />
        )}
      </div>
    </div>
  );
}

export default EntitySelector;
