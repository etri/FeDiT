import { useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Plus, Workflow } from 'lucide-react';

import { translatorQueries } from '@/apis/translator';
import CreateFormPopup from '@/app/(app)/service/agents/_components/agentDetail/translator/CreateFormPopup';
import { TranslatorList } from '@/app/(app)/service/agents/_components/agentDetail/translator/TranslatorList';

import type { AgentModel } from '@/apis/agent';

interface TranslatorProps {
  agentId: number;
  modelInfoList: AgentModel[];
}

export function Translator({ agentId, modelInfoList }: TranslatorProps) {
  const [createFormToggle, setCreateFormToggle] = useState(false);
  const { data } = useSuspenseQuery({
    ...translatorQueries.list({ agentId }),
  });
  const translators = data.data;

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
            Translators
          </h3>
          {translators.length > 0 && (
            <span className="text-muted-foreground text-xs">
              ({translators.length})
            </span>
          )}
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreateFormToggle(true)}
        >
          <Plus className="size-3.5" />
          New Translator
        </Button>
      </div>

      {translators.length === 0 ? (
        <Empty className="border-border flex-1 rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Workflow className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No translators</EmptyTitle>
            <EmptyDescription>
              Create a translator to transform incoming data for this agent.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <TranslatorList translators={translators} />
        </ScrollArea>
      )}

      {createFormToggle && (
        <CreateFormPopup
          open={createFormToggle}
          agentId={agentId}
          modelInfoList={modelInfoList}
          closeCreateFormPopup={() => setCreateFormToggle(false)}
        />
      )}
    </div>
  );
}
