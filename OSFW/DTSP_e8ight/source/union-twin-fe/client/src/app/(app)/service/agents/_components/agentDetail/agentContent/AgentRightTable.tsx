import { Field, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import { useShallow } from 'zustand/react/shallow';

import AgentConfigSection from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentConfigSection';
import AgentKafkaSection from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentKafkaSection';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';

function AgentRightTable() {
  const { agent, setAgent, agentMode } = useAgentStore(
    useShallow((s) => ({
      agent: s.agent,
      setAgent: s.setAgent,
      agentMode: s.agentMode,
    })),
  );

  const isEditable = agentMode !== 'read';

  if (agent.type === 'KAFKA' && isEditable) {
    return (
      <div className="space-y-3">
        <AgentKafkaSection />
        <AgentConfigSection />
      </div>
    );
  }

  const isKafka = agent.type === 'KAFKA';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>{isKafka ? 'Kafka Bootstrap Servers' : 'URL'}</FieldLabel>
          <Input
            placeholder="https://example.com/api"
            value={agent.urlAddress}
            readOnly={!isEditable}
            onChange={(e) =>
              setAgent((prev) => ({
                ...prev,
                urlAddress: e.target.value,
              }))
            }
          />
        </Field>
        <Field>
          <FieldLabel>{isKafka ? 'Source Topic' : 'Connect Term'}</FieldLabel>
          <Input
            placeholder="Enter connect term"
            value={isKafka ? agent.sourceTopic : agent.connTerm}
            readOnly={!isEditable}
            onChange={(e) =>
              setAgent((prev) => ({ ...prev, connTerm: e.target.value }))
            }
          />
        </Field>
      </div>

      <AgentConfigSection />
    </div>
  );
}

export default AgentRightTable;
