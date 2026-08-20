import { useRef, useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@e8ight/ui/components/ui/field';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { Textarea } from '@e8ight/ui/components/ui/textarea';
import { useShallow } from 'zustand/react/shallow';

import { usePutAgentConfigMutation } from '@/apis/agent';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';

const CONFIG_LOCKED_STATUSES = ['RUN', 'HANG', 'DELETED'];

function AgentConfigSection() {
  const { agent, setAgent, agentMode } = useAgentStore(
    useShallow((s) => ({
      agent: s.agent,
      setAgent: s.setAgent,
      agentMode: s.agentMode,
    })),
  );
  const [draft, setDraft] = useState(agent.confFileContents);
  const prevMode = useRef(agentMode);
  const { mutateAsync, isPending } = usePutAgentConfigMutation();

  if (prevMode.current !== agentMode) {
    prevMode.current = agentMode;
    if (agentMode === 'edit') setDraft(agent.confFileContents);
  }

  if (agentMode === 'add') return null;

  const isLocked = CONFIG_LOCKED_STATUSES.includes(agent.status);

  async function handleSaveConfig() {
    try {
      await mutateAsync({
        agentId: agent.id,
        agentName: agent.name,
        confFileContents: draft,
      });
      setAgent((prev) => ({
        ...prev,
        confFileContents: draft,
        isCustomConfig: true,
      }));
      toast.success('Configuration saved.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save configuration.',
      );
    }
  }

  if (agentMode !== 'edit') {
    if (!agent.confFileContents) return null;
    return (
      <Field>
        <FieldLabel>Configuration File</FieldLabel>
        <div className="bg-muted/40 h-[300px] overflow-hidden rounded-md shadow-inner">
          <ScrollArea className="h-full w-full">
            <pre className="text-muted-foreground p-3 font-mono text-xs break-all whitespace-pre-wrap">
              {agent.confFileContents}
            </pre>
          </ScrollArea>
        </div>
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel>Configuration File</FieldLabel>
      <Textarea
        className="h-[300px] font-mono text-xs"
        value={draft}
        readOnly={isLocked}
        onChange={(e) => setDraft(e.target.value)}
      />
      <FieldDescription>
        {isLocked
          ? `${agent.status} 상태에서는 conf를 수정할 수 없습니다. 먼저 중지하세요`
          : 'conf를 직접 저장하면 이후 Agent 정보 수정 시 conf가 재생성되어 편집 내용이 사라집니다'}
      </FieldDescription>
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={isLocked || isPending || draft === agent.confFileContents}
          onClick={handleSaveConfig}
        >
          {isPending && <Spinner className="size-4" />}
          Config 저장
        </Button>
      </div>
    </Field>
  );
}

export default AgentConfigSection;
