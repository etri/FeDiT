import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { agentKeys } from '@/apis/agent';
import AgentContent from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentContent';
import { getQueryClient } from '@/lib/get-query-client';
import { ndxproUpstream } from '@/lib/ndxpro-api';

async function fetchAgentDetailServer(agentName: string): Promise<unknown> {
  const { baseUrl, token } = ndxproUpstream();

  const url = new URL(`${baseUrl}/ingest/agent`);
  url.searchParams.set('name', agentName);

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch agent: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export default async function Page({
  params,
}: {
  params: Promise<{ agentName: string }>;
}) {
  const { agentName: rawAgentName } = await params;
  const agentName = decodeURIComponent(rawAgentName);

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: agentKeys.detail(agentName),
    queryFn: () => fetchAgentDetailServer(agentName),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentContent />
    </HydrationBoundary>
  );
}
