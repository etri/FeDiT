import { Button } from '@e8ight/ui/components/ui/button';
import { CollapsibleTrigger } from '@e8ight/ui/components/ui/collapsible';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

import InputRenderer from '@/app/(app)/tracking/_components/InputRenderer';
import { SELECT_OPTIONS } from '@/app/(app)/tracking/_constants/formFieldConfigs';

import type { TrckProcInfo } from '@/app/(app)/tracking/_types/trackingProcessForm';

interface ProcessPanelHeaderProps {
  process: TrckProcInfo;
  isExpanded: boolean;
  fieldErrors: Record<string, boolean>;
  onFieldChange: (field: string, value: unknown) => void;
  onRemove: () => void;
}

function ProcessPanelHeader({
  process,
  isExpanded,
  fieldErrors,
  onFieldChange,
  onRemove,
}: ProcessPanelHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium">
              Tracking Type
            </span>
            <span className="text-muted-foreground text-xs">
              트래킹 프로세스 타입
            </span>
          </div>
          <InputRenderer
            type="select"
            value={process.trckTp}
            onChange={(val) => onFieldChange('trckTp', val)}
            error={fieldErrors['trckTp']}
            options={SELECT_OPTIONS.trackingType}
            className="w-full sm:max-w-[220px]"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium">
              Tracking Process Identifier
            </span>
            <span className="text-muted-foreground text-xs">
              트래킹 프로세스 실행 시 단위 트래킹에 대한 식별자
            </span>
          </div>
          <InputRenderer
            type="text"
            value={process.trckPrcIdtifier}
            onChange={(val) => onFieldChange('trckPrcIdtifier', val)}
            error={fieldErrors['trckPrcIdtifier']}
            placeholder="DT-13"
            className="w-full sm:max-w-[220px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </CollapsibleTrigger>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}

export default ProcessPanelHeader;
