import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import {
  getAgentDetail,
  getAgentList,
  getAgentLogs,
  getAgentModelAttributeSources,
} from '@/apis/agent/agentApi';

import type { AgentListParams } from '@/apis/agent/agent.types';

export const agentKeys = {
  all: ['agent'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (params: AgentListParams) => [...agentKeys.lists(), params] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (agentName: string) => [...agentKeys.details(), agentName] as const,
  logs: (agentId: number) => [...agentKeys.all, 'logs', agentId] as const,
  attributeSources: (agentId: number) =>
    [...agentKeys.all, 'attribute-sources', agentId] as const,
  attributeSourceList: (agentId: number, params: { modelType: string }) =>
    [...agentKeys.attributeSources(agentId), params] as const,
};

export const agentQueries = {
  list: (params: AgentListParams) =>
    queryOptions({
      queryKey: agentKeys.list(params),
      queryFn: () => getAgentList(params),
      placeholderData: keepPreviousData,
    }),
  detail: (agentName: string) =>
    queryOptions({
      queryKey: agentKeys.detail(agentName),
      queryFn: () => getAgentDetail(agentName),
    }),
  logs: (agentId: number) =>
    queryOptions({
      queryKey: agentKeys.logs(agentId),
      queryFn: () => getAgentLogs(agentId),
    }),
  attributeSources: (agentId: number, params: { modelType: string }) =>
    queryOptions({
      queryKey: agentKeys.attributeSourceList(agentId, params),
      queryFn: () => getAgentModelAttributeSources(agentId, params),
      placeholderData: keepPreviousData,
    }),
};
