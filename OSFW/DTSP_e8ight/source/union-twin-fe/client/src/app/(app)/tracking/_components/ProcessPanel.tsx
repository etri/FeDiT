import {
  Collapsible,
  CollapsibleContent,
} from '@e8ight/ui/components/ui/collapsible';

import DataTrackingFields from '@/app/(app)/tracking/_components/DataTrackingFields';
import EventTrackingFields from '@/app/(app)/tracking/_components/EventTrackingFields';
import ProcessPanelHeader from '@/app/(app)/tracking/_components/ProcessPanelHeader';

import type { TrckProcInfo } from '@/app/(app)/tracking/_types/trackingProcessForm';

interface ProcessPanelProps {
  process: TrckProcInfo;
  fieldErrors: Record<string, boolean>;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onFieldChange: (field: string, value: unknown) => void;
}

function ProcessPanel({
  process,
  fieldErrors,
  isExpanded,
  onToggle,
  onRemove,
  onFieldChange,
}: ProcessPanelProps) {
  const isDataTracking = process.trckTp === 'DTP';

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggle}
      suppressHydrationWarning
    >
      <div className="bg-card flex flex-col rounded-lg border shadow-sm">
        <div className="px-4 py-4">
          <ProcessPanelHeader
            process={process}
            isExpanded={isExpanded}
            fieldErrors={fieldErrors}
            onFieldChange={onFieldChange}
            onRemove={onRemove}
          />
        </div>

        <CollapsibleContent suppressHydrationWarning>
          <div className="@container/field-group flex flex-col gap-4 border-t px-4 py-4">
            {isDataTracking && (
              <DataTrackingFields
                process={process}
                fieldErrors={fieldErrors}
                onFieldChange={onFieldChange}
              />
            )}

            <EventTrackingFields
              process={process}
              fieldErrors={fieldErrors}
              onFieldChange={onFieldChange}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default ProcessPanel;
