import { Badge } from '@e8ight/ui/components/ui/badge';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { useShallow } from 'zustand/react/shallow';

import { DEFAULT_TOPIC } from '@/app/(app)/service/agents/_constants/kafkaAgent';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';
import { useRuntimeConfig } from '@/components/providers/RuntimeConfigProvider';

function AgentInfoTable() {
  const { agent, setAgent, agentMode } = useAgentStore(
    useShallow((s) => ({
      agent: s.agent,
      setAgent: s.setAgent,
      agentMode: s.agentMode,
    })),
  );

  const { fdtSyncKafkaUrl } = useRuntimeConfig();

  const isEditable = agentMode !== 'read';
  const isKafka = agent.type === 'KAFKA';

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>
          Name {isEditable && <span className="text-destructive">*</span>}
        </FieldLabel>
        <Input
          placeholder={isKafka ? '객체 선택 시 자동 설정' : 'Enter agent name'}
          value={agent.name}
          readOnly={agentMode !== 'add' || isKafka}
          onChange={(e) =>
            setAgent((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </Field>

      {agentMode !== 'add' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>ID</FieldLabel>
            <Input value={String(agent.id)} readOnly />
          </Field>
          <Field>
            <FieldLabel>PID</FieldLabel>
            <Input
              value={agent.pid === null ? '-' : String(agent.pid)}
              readOnly
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>Type</FieldLabel>
          {isEditable ? (
            <Select
              value={agent.type}
              onValueChange={(val) =>
                setAgent((prev) =>
                  val === 'KAFKA'
                    ? {
                        ...prev,
                        type: val,
                        isCustomTopic: true,
                        topic: DEFAULT_TOPIC,
                        urlAddress: fdtSyncKafkaUrl,
                      }
                    : { ...prev, type: val },
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HTTP">http</SelectItem>
                <SelectItem value="HTTPS">https</SelectItem>
                <SelectItem value="KAFKA">kafka</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input value={agent.type} readOnly />
          )}
        </Field>

        {(agent.type === 'HTTP' || agent.type === 'HTTPS') && (
          <Field>
            <FieldLabel>Method</FieldLabel>
            {isEditable ? (
              <Select
                value={agent.method}
                onValueChange={(val) =>
                  setAgent((prev) => ({ ...prev, method: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input value={agent.method} readOnly />
            )}
          </Field>
        )}
      </div>

      {agentMode !== 'add' && (
        <Field>
          <FieldLabel>Status</FieldLabel>
          <div>
            <Badge
              variant={
                agent.status === 'RUN' || agent.status === 'HANG'
                  ? 'default'
                  : 'secondary'
              }
            >
              {agent.status}
            </Badge>
          </div>
        </Field>
      )}

      <Field className={isKafka && isEditable ? 'hidden' : undefined}>
        <FieldLabel>
          Topic {isEditable && <span className="text-destructive">*</span>}
        </FieldLabel>
        <Input
          value={isEditable ? DEFAULT_TOPIC : agent.topic || '-'}
          readOnly
        />
        {isEditable && (
          <FieldDescription>
            수집 데이터가 발행되는 고정 토픽입니다. Translator가 이 토픽을
            구독합니다.
          </FieldDescription>
        )}
      </Field>

      {agentMode !== 'add' && !isKafka && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>Last Ingesting</FieldLabel>
            <Input value={agent.lastSourceSignalReceivedAt || '-'} readOnly />
          </Field>
          <Field>
            <FieldLabel>Last Kafka</FieldLabel>
            <Input value={agent.lastSinkSignalReceivedAt || '-'} readOnly />
          </Field>
        </div>
      )}
    </div>
  );
}

export default AgentInfoTable;
