'use client';

import { Suspense, useEffect, useRef } from 'react';

import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { ErrorBoundary } from '@suspensive/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';

import { agentQueries } from '@/apis/agent';
import AgentInfo from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentInfo';
import AgentNav from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentNav';
import { Translator } from '@/app/(app)/service/agents/_components/agentDetail/translator/Translator';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

function AgentContentInner({ agentName }: { agentName: string }) {
  const { setAgent, setAgentModel, setAgentMode } = useAgentStore(
    useShallow((s) => ({
      setAgent: s.setAgent,
      setAgentModel: s.setAgentModel,
      setAgentMode: s.setAgentMode,
    })),
  );
  const agentMode = useAgentStore((s) => s.agentMode);
  const agentModeRef = useRef(agentMode);
  agentModeRef.current = agentMode;
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'agent-info';

  const { data } = useSuspenseQuery({
    ...agentQueries.detail(agentName),
  });

  useEffect(() => {
    if (data && agentModeRef.current !== 'edit') {
      setAgentMode('read');
      setAgent(data);
      setAgentModel(data.models);
    }
  }, [data, setAgentMode, setAgent, setAgentModel]);

  return tab === 'translator' ? (
    <Translator
      agentId={data.id}
      agentTopic={data.topic}
      modelInfoList={data.models}
    />
  ) : (
    <AgentInfo />
  );
}

function AgentContent() {
  const params = useParams<{ agentName: string }>();
  const agentName = params.agentName
    ? decodeURIComponent(params.agentName)
    : undefined;

  if (!agentName) {
    return null;
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <AgentNav />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-4">
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense
            fallback={
              <div className="flex min-h-[200px] flex-1 items-center justify-center p-8">
                <Spinner className="text-muted-foreground size-6" />
              </div>
            }
          >
            <AgentContentInner agentName={agentName} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default AgentContent;
