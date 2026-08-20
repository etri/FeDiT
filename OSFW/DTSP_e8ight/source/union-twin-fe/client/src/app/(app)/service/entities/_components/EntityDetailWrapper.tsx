'use client';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { PanelsTopLeft } from 'lucide-react';

import EntityDetail from '@/app/(app)/service/entities/_components/EntityDetail';
import { useEntityParams } from '@/app/(app)/service/entities/_hooks/useEntityParams';
import useEntityTabList from '@/app/(app)/service/entities/_hooks/useEntityTabList';

export default function EntityDetailWrapper() {
  const [entityTabList, entityTabListAction] = useEntityTabList();
  const { contextId, modelId, entityId } = useEntityParams();

  const hasModelSelection = Boolean(contextId) && Boolean(modelId);
  const hasEntityInRoute = hasModelSelection && Boolean(entityId);
  const scopeKey = `${contextId ?? ''}:${modelId ?? ''}`;

  if (hasEntityInRoute) {
    return (
      <EntityDetail
        key={scopeKey}
        entityTabList={entityTabList}
        appendEntityTabList={entityTabListAction.append}
        removeEntityTabList={entityTabListAction.remove}
      />
    );
  }

  return (
    <div className="bg-background flex h-full min-h-0 flex-col px-4 py-6">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Empty className="max-w-md border-0 bg-transparent">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PanelsTopLeft className="size-4" />
            </EmptyMedia>
            <EmptyTitle>
              {hasModelSelection
                ? 'Detail panel is ready'
                : 'Start from the sidebar'}
            </EmptyTitle>
            <EmptyDescription>
              {hasModelSelection
                ? 'Pick an entity from the middle panel to inspect its attributes here.'
                : 'Select a context and data model from the left sidebar to browse entities and open details here.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </div>
  );
}
