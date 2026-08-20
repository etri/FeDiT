import { useSuspenseQuery } from '@tanstack/react-query';
import { difference } from 'es-toolkit';

import { modelQueries } from '@/apis/model/model.queries';
import EntityAttributeInspector from '@/app/(app)/service/entities/_components/EntityAttributeInspector';
import EntityAttributeNavigator from '@/app/(app)/service/entities/_components/EntityAttributeNavigator';
import InfoContainer from '@/app/(app)/service/entities/_components/InfoContainer';
import { useActiveEntityTab } from '@/app/(app)/service/entities/_hooks/useActiveEntityTab';
import { useEntityAttributeTree } from '@/app/(app)/service/entities/_hooks/useEntityAttributeTree';
import { useEntityDetail } from '@/app/(app)/service/entities/_hooks/useEntityDetail';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import { useOpenRelatedEntity } from '@/app/(app)/service/entities/_hooks/useOpenRelatedEntity';

import type { EntityTabType } from '@/app/(app)/service/entities/_types/entity';

interface AttributeInfoProps {
  appendEntityTabList: (newEntityTab: EntityTabType) => void;
}

function AttributeInfo({ appendEntityTabList }: AttributeInfoProps) {
  const activeEntityTab = useActiveEntityTab();

  const { dynamicDetail, staticDetail } = useEntityDetail({
    observedTimeInfoProperty:
      activeEntityTab.searchInfo.observedTimeInfo?.property,
  });

  const {
    jsonForTreeList,
    currentEntityPath,
    selectedAttribute,
    handleAttributeSelect,
    foldAllHandler,
  } = useEntityAttributeTree({
    dynamicDetail,
    staticDetail,
  });

  const { modelId } = useEntityParams();
  const { data: dataModel } = useSuspenseQuery(modelQueries.detail(modelId));

  const observationHints = difference(
    dataModel.observation ?? [],
    (jsonForTreeList[0] ?? []).map((item) => item.target),
  );

  const openRelatedEntity = useOpenRelatedEntity({ appendEntityTabList });

  return (
    <InfoContainer title="Attributes" path={currentEntityPath}>
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-2 gap-2 xl:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)] xl:grid-rows-1">
        <EntityAttributeNavigator
          treeJson={jsonForTreeList}
          selectedTreePath={selectedAttribute?.treePath}
          onSelect={handleAttributeSelect}
          onCollapseAll={() => foldAllHandler(false)}
          onExpandAll={() => foldAllHandler(true)}
          observationHints={observationHints}
        />
        <EntityAttributeInspector
          selection={selectedAttribute}
          onOpenEntity={openRelatedEntity}
        />
      </div>
    </InfoContainer>
  );
}

export default AttributeInfo;
