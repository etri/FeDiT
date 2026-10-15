import { ndxproClient } from '@/apis/client';
import { NDXPRO_API } from '@/apis/config';

import type {
  Agent,
  AgentListParams,
  AgentModelAttributeSource,
  AgentOperation,
  CreateAgentPayload,
  CreateAttributeSourcePayload,
} from '@/apis/agent/agent.types';
import type { LogResponse } from '@/types/common';

export const getAgentList = async (payload: AgentListParams) => {
  const { data } = await ndxproClient.get(`${NDXPRO_API}/ingest/agents`, {
    params: payload,
  });
  return data;
};

export const getAgentDetail = async (agentName: string) => {
  const { data } = await ndxproClient.get(`${NDXPRO_API}/ingest/agent`, {
    params: { name: agentName },
  });
  return data;
};

export const getAgentLogs = async (agentId: number) => {
  const { data } = await ndxproClient.get<LogResponse>(
    `${NDXPRO_API}/ingest/logs`,
    { params: { agentId } },
  );
  return data;
};

export const postAgentData = async (payload: CreateAgentPayload) => {
  const { data } = await ndxproClient.post(
    `${NDXPRO_API}/ingest/agents`,
    payload,
  );
  return data;
};

export const deleteAgent = async (agentId: number) => {
  const { data } = await ndxproClient.delete(
    `${NDXPRO_API}/ingest/agents/${agentId}`,
  );
  return data;
};

export const putAgentData = async (
  agentId: number,
  payload: Agent,
  regenerateConfig?: boolean,
) => {
  const { data } = await ndxproClient.put(
    `${NDXPRO_API}/ingest/agents/${agentId}`,
    payload,
    { params: regenerateConfig ? { regenerateConfig: true } : undefined },
  );
  return data;
};

export const patchAgentOperation = async (
  agentId: number,
  operation: AgentOperation,
) => {
  const { data } = await ndxproClient.patch(
    `${NDXPRO_API}/ingest/agents/${agentId}`,
    {
      operation,
    },
  );
  return data;
};

export const putAgentConfig = async (
  agentId: number,
  confFileContents: string,
) => {
  const { data } = await ndxproClient.put(
    `${NDXPRO_API}/ingest/agents/${agentId}/config`,
    { confFileContents },
  );
  return data;
};

export const getAgentModelAttributeSources = async (
  agentId: number,
  payload: { modelType: string },
) => {
  const { data } = await ndxproClient.get<AgentModelAttributeSource[]>(
    `${NDXPRO_API}/ingest/agents/${agentId}/attribute-sources`,
    { params: payload },
  );
  return data;
};

export const postAgentModelAttributeSource = async (
  agentId: number,
  payload: CreateAttributeSourcePayload,
) => {
  const { data } = await ndxproClient.post<AgentModelAttributeSource>(
    `${NDXPRO_API}/ingest/agents/${agentId}/attribute-sources`,
    payload,
  );
  return data;
};

export const deleteAgentModelAttributeSource = async (
  agentId: number,
  attributeSourceId: number,
) => {
  const { data } = await ndxproClient.delete(
    `${NDXPRO_API}/ingest/agents/${agentId}/attribute-sources/${attributeSourceId}`,
  );
  return data;
};
