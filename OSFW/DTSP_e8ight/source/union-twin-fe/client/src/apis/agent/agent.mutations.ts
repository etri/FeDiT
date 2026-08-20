import { useMutation, useQueryClient } from '@tanstack/react-query';

import { agentKeys } from '@/apis/agent/agent.queries';
import {
  deleteAgent,
  deleteAgentModelAttributeSource,
  patchAgentOperation,
  postAgentData,
  postAgentModelAttributeSource,
  putAgentConfig,
  putAgentData,
} from '@/apis/agent/agentApi';

import type {
  Agent,
  AgentOperation,
  CreateAgentPayload,
  CreateAttributeSourcePayload,
} from '@/apis/agent/agent.types';

export function usePostAgentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAgentPayload) => postAgentData(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

export function usePutAgentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      agentId: number;
      agentName: string;
      payload: Agent;
      regenerateConfig?: boolean;
    }) =>
      putAgentData(
        variables.agentId,
        variables.payload,
        variables.regenerateConfig,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({
        queryKey: agentKeys.detail(variables.agentName),
      });
    },
  });
}

export function usePatchAgentOperationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      agentId: number;
      agentName: string;
      operation: AgentOperation;
    }) => patchAgentOperation(variables.agentId, variables.operation),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({
        queryKey: agentKeys.detail(variables.agentName),
      });
    },
  });
}

export function usePutAgentConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      agentId: number;
      agentName: string;
      confFileContents: string;
    }) => putAgentConfig(variables.agentId, variables.confFileContents),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({
        queryKey: agentKeys.detail(variables.agentName),
      });
    },
  });
}

export function useDeleteAgentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: number) => deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

export function usePostAgentModelAttributeSourceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      agentId: number;
      payload: CreateAttributeSourcePayload;
    }) => postAgentModelAttributeSource(variables.agentId, variables.payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: agentKeys.attributeSources(variables.agentId),
      });
    },
  });
}

export function useDeleteAgentModelAttributeSourceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { agentId: number; attributeSourceId: number }) =>
      deleteAgentModelAttributeSource(
        variables.agentId,
        variables.attributeSourceId,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: agentKeys.attributeSources(variables.agentId),
      });
    },
  });
}
