import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { cn } from 'cn';
import { ChevronDown, ChevronUp, CircleStop, Play } from 'lucide-react';

import { usePatchTranslatorControlMutation } from '@/apis/translator';
import {
  isTranslatorRunning,
  isTranslatorStopped,
} from '@/app/(app)/service/agents/_components/agentDetail/translator/translatorStatus';
import {
  AGENT_STATUS_CLASS,
  AGENT_STATUS_VARIANT,
} from '@/app/(app)/service/agents/_constants/agentStatus';

import type { TranslatorType } from '@/apis/translator/translator.types';

interface TranslatorHeaderProps {
  translator: TranslatorType;
  isEdit: boolean;
  isActive: boolean;
  onChangeTabToggle: () => void;
}

export function TranslatorHeader({
  translator,
  isEdit,
  isActive,
  onChangeTabToggle,
}: TranslatorHeaderProps) {
  const patchTranslatorControlMutation = usePatchTranslatorControlMutation();

  return (
    <div
      role="button"
      tabIndex={0}
      className="hover:bg-muted/50 flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors"
      onClick={onChangeTabToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChangeTabToggle();
        }
      }}
    >
      {isActive ? (
        <ChevronUp className="text-muted-foreground size-4 shrink-0" />
      ) : (
        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
      )}

      <span className="min-w-0 truncate text-sm font-medium">
        {translator.name}
      </span>

      <Badge
        variant={AGENT_STATUS_VARIANT[translator.status] ?? 'secondary'}
        className={cn('shrink-0', AGENT_STATUS_CLASS[translator.status])}
      >
        {translator.status}
      </Badge>

      <span className="text-muted-foreground truncate text-xs">
        {translator.modelType}
      </span>

      {!isEdit && (
        <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:ml-auto sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="gap-1"
            disabled={
              patchTranslatorControlMutation.isPending ||
              isTranslatorRunning(translator.status)
            }
            onClick={(e) => {
              e.stopPropagation();
              void patchTranslatorControlMutation.mutateAsync({
                translatorId: translator.id,
                payload: { operation: 'run' },
              });
            }}
          >
            <Play className="size-3.5" />
            Start
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="gap-1"
            disabled={
              patchTranslatorControlMutation.isPending ||
              isTranslatorStopped(translator.status)
            }
            onClick={(e) => {
              e.stopPropagation();
              void patchTranslatorControlMutation.mutateAsync({
                translatorId: translator.id,
                payload: { operation: 'stop' },
              });
            }}
          >
            <CircleStop className="size-3.5" />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
}
