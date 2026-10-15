import { useState } from 'react';

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
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';

import { fdtSyncQueries } from '@/apis/fdtSync';
import { DEFAULT_TOPIC } from '@/app/(app)/service/agents/_constants/kafkaAgent';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';
import { useRuntimeConfig } from '@/components/providers/RuntimeConfigProvider';

function toKafkaTopic(federatedObjectId: string) {
  return federatedObjectId ? `FDO_${federatedObjectId}` : '';
}

function AgentKafkaSection() {
  const { agent, setAgent } = useAgentStore(
    useShallow((s) => ({ agent: s.agent, setAgent: s.setAgent })),
  );
  const [federatedTwinId, setFederatedTwinId] = useState('');
  const [federatedObjectId, setFederatedObjectId] = useState('');
  const { fdtSyncKafkaUrl } = useRuntimeConfig();

  const {
    data: twins = [],
    isPending: isTwinsPending,
    isError: isTwinsError,
  } = useQuery(fdtSyncQueries.twins());
  const {
    data: objects = [],
    isPending: isObjectsPending,
    isError: isObjectsError,
  } = useQuery(fdtSyncQueries.objects(federatedTwinId));

  function selectObject(objectId: string) {
    const topic = toKafkaTopic(objectId);
    setFederatedObjectId(objectId);
    setAgent((prev) => ({ ...prev, name: topic, sourceTopic: topic }));
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs">수집 (Inbound)</p>

        <Field>
          <FieldLabel>
            URL <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            placeholder={fdtSyncKafkaUrl}
            value={agent.urlAddress}
            onChange={(e) =>
              setAgent((prev) => ({ ...prev, urlAddress: e.target.value }))
            }
          />
          <FieldDescription>수집 대상 Kafka 주소</FieldDescription>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>디지털 트윈</FieldLabel>
            <Select
              value={federatedTwinId}
              onValueChange={(value) => {
                setFederatedTwinId(value);
                setFederatedObjectId('');
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isTwinsError
                      ? '목록을 불러오지 못했습니다'
                      : isTwinsPending
                        ? '불러오는 중입니다'
                        : '트윈을 선택하세요'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {twins.map((twin) => (
                  <SelectItem
                    key={twin.federated_digital_twin_id}
                    value={twin.federated_digital_twin_id}
                  >
                    {twin.federated_digital_twin_name} (
                    {twin.number_of_federated_digital_objects})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>
              객체 <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              value={federatedObjectId}
              disabled={!federatedTwinId}
              onValueChange={selectObject}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !federatedTwinId
                      ? '트윈을 먼저 선택하세요'
                      : isObjectsError
                        ? '목록을 불러오지 못했습니다'
                        : isObjectsPending
                          ? '불러오는 중입니다'
                          : '객체를 선택하세요'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {objects.map((object) => (
                  <SelectItem
                    key={object.federated_digital_object_id}
                    value={object.federated_digital_object_id}
                  >
                    {object.federated_digital_object_name} (
                    {object.federated_digital_object_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel>
            수집 Topic <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            placeholder="FDO_F-KR-109941-0007"
            value={agent.sourceTopic}
            onChange={(e) => {
              setFederatedObjectId('');
              setAgent((prev) => ({
                ...prev,
                name: e.target.value,
                sourceTopic: e.target.value,
              }));
            }}
          />
          <FieldDescription>
            객체를 선택하면 자동으로 채워지며, 직접 입력할 수도 있습니다. Agent
            이름으로도 사용됩니다
          </FieldDescription>
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground text-xs">적재 (Outbound)</p>

        <Field>
          <FieldLabel>
            목적지 Topic <span className="text-destructive">*</span>
          </FieldLabel>
          <Input value={DEFAULT_TOPIC} readOnly />
          <FieldDescription>
            수집한 데이터를 넣을 고정 토픽입니다. Translator가 이 토픽을
            구독합니다.
          </FieldDescription>
        </Field>
      </div>
    </div>
  );
}

export default AgentKafkaSection;
