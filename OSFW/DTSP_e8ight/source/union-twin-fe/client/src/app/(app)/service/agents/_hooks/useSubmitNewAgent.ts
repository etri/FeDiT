import { toast } from '@e8ight/ui/components/ui/sonner';
import { useShallow } from 'zustand/react/shallow';

import { usePostAgentMutation } from '@/apis/agent';
import { agentSchema } from '@/app/(app)/service/agents/_schemas/agent.schema';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';

export function useSubmitNewAgent() {
  const { agent, agentModel } = useAgentStore(
    useShallow((s) => ({ agent: s.agent, agentModel: s.agentModel })),
  );
  const { mutateAsync, isPending } = usePostAgentMutation();

  async function submit(onSuccess: () => void) {
    const parsed = agentSchema.safeParse(agent);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(', ');
      toast.error(`Validation failed: ${messages}`);
      return;
    }

    await mutateAsync({
      name: agent.name,
      type: agent.type,
      urlAddress: agent.urlAddress,
      isCustomTopic: agent.isCustomTopic,
      topic: agent.isCustomTopic ? agent.topic : undefined,
      models: agentModel,
      ...(agent.type === 'KAFKA'
        ? { sourceTopic: agent.sourceTopic }
        : { method: agent.method, connTerm: agent.connTerm }),
    });
    toast.success('Agent created successfully.');
    onSuccess();
  }

  return { submit, isPending };
}
