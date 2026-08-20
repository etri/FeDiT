import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';

import EntityHistoryTable from '@/app/(app)/service/entities/_components/entityHistory/EntityHistoryTable';
import { EntityTableSkeleton } from '@/app/(app)/service/entities/_components/EntityTableSkeleton';

import type { EntityHistoryDto } from '@/apis/entity';

interface IProps {
  entitiesHistoryData: EntityHistoryDto[];
  activeHistoryId: string | undefined;
  shouldShowSelectObservedTimePrompt: boolean;
  shouldShowNoHistoryEmpty: boolean;
  showHistoryLoading: boolean;
  onSelectHistory: (historyData: EntityHistoryDto) => void;
}

function EntityHistoryContent({
  entitiesHistoryData,
  activeHistoryId,
  shouldShowSelectObservedTimePrompt,
  shouldShowNoHistoryEmpty,
  showHistoryLoading,
  onSelectHistory,
}: IProps) {
  if (entitiesHistoryData.length > 0) {
    return (
      <EntityHistoryTable
        entitiesHistoryData={entitiesHistoryData}
        activeHistoryId={activeHistoryId}
        onSelectHistory={onSelectHistory}
      />
    );
  }

  if (shouldShowSelectObservedTimePrompt) {
    return (
      <div className="flex h-full items-center justify-center py-10">
        <Empty className="max-w-sm border-0 bg-transparent">
          <EmptyHeader>
            <EmptyTitle>Select an observed time field</EmptyTitle>
            <EmptyDescription>
              Choose a field above to load history for this entity.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (shouldShowNoHistoryEmpty) {
    return (
      <div className="flex h-full items-center justify-center py-10">
        <Empty className="max-w-sm border-0 bg-transparent">
          <EmptyHeader>
            <EmptyTitle>No history found</EmptyTitle>
            <EmptyDescription>
              Adjust the filters or return to the entity list.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (showHistoryLoading) {
    return <EntityTableSkeleton />;
  }

  return null;
}

export default EntityHistoryContent;
