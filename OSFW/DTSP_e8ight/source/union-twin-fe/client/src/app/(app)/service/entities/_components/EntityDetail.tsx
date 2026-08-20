'use client';

import { useEffect } from 'react';

import { toast } from '@e8ight/ui/components/ui/sonner';
import { ErrorBoundary, Suspense } from '@suspensive/react';

import { AttributeDetailSkeleton } from '@/app/(app)/service/entities/_components/AttributeDetailSkeleton';
import AttributeInfo from '@/app/(app)/service/entities/_components/AttributeInfo';
import EntityTabList from '@/app/(app)/service/entities/_components/EntityTabList';
import { useSwitchEntityTab } from '@/app/(app)/service/entities/_hooks/useActiveEntityTab';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

import type { EntityTabType } from '@/app/(app)/service/entities/_types/entity';

interface IProps {
  entityTabList: EntityTabType[];
  appendEntityTabList: (newEntityTab: EntityTabType) => void;
  removeEntityTabList: (entityDetailId: string) => void;
}

function EntityDetail({
  entityTabList,
  appendEntityTabList,
  removeEntityTabList,
}: IProps) {
  const param = useEntityParams();

  const switchEntityTab = useSwitchEntityTab();

  useEffect(() => {
    const detailId = param.historyId ?? param.entityId;
    if (!detailId) {
      return;
    }

    const matchingTab = entityTabList.find((tab) => tab.detailId === detailId);
    if (matchingTab) {
      switchEntityTab(matchingTab);
    }
  }, [param.entityId, param.historyId, entityTabList, switchEntityTab]);

  return (
    <div className="bg-background text-foreground flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 overflow-hidden border-b px-2 py-1.5">
        <EntityTabList
          entityTabList={entityTabList}
          removeEntityTabList={removeEntityTabList}
        />
      </div>
      <section className="flex min-h-0 min-w-0 flex-1 overflow-hidden p-2 pt-1.5">
        <ErrorBoundary
          resetKeys={[param.entityId, param.historyId]}
          fallback={<QueryErrorFallback />}
          onError={() => {
            const detailId = param.entityId;
            if (!detailId) {
              return;
            }
            toast.error(`Failed to retrieve Entity - entity id: ${detailId}`);
            removeEntityTabList(detailId);
          }}
        >
          <Suspense fallback={<AttributeDetailSkeleton />}>
            <AttributeInfo appendEntityTabList={appendEntityTabList} />
          </Suspense>
        </ErrorBoundary>
      </section>
    </div>
  );
}

export default EntityDetail;
