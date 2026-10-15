import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import { useShallow } from 'zustand/react/shallow';

import AgentConfigSection from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentConfigSection';
import AgentKafkaSection from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentKafkaSection';
import { AgentQueryParamsEditor } from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentQueryParamsEditor';
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
          <FieldLabel>
            {isKafka ? 'Source Topic' : 'Connect Term (초)'}
          </FieldLabel>
          <Input
            placeholder={isKafka ? 'Enter source topic' : '예: 60'}
            value={isKafka ? agent.sourceTopic : agent.connTerm}
            readOnly={!isEditable}
            onChange={(e) =>
              setAgent((prev) => ({ ...prev, connTerm: e.target.value }))
            }
          />
          {!isKafka && (
            <FieldDescription>
              폴링 주기입니다. 초 단위로 입력하며 60이면 1분마다, 3600이면
              1시간마다 URL을 호출합니다.
            </FieldDescription>
          )}
        </Field>
      </div>

      {!isKafka && isEditable && (
        <AgentQueryParamsEditor
          url={agent.urlAddress}
          onUrlChange={(urlAddress) =>
            setAgent((prev) => ({ ...prev, urlAddress }))
          }
        />
      )}

      <AgentConfigSection />
    </div>
  );
}

export default AgentRightTable;
