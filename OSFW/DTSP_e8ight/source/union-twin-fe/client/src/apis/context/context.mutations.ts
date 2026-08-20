import { useMutation, useQueryClient } from '@tanstack/react-query';

import { contextKeys } from '@/apis/context/context.queries';
import {
  addContextModelData,
  createContextData,
  deleteContextData,
  subContextModelData,
} from '@/apis/context/contextApi';

import type { CreateContextPayload } from '@/types/context';

export function useCreateContextWithModelsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      body: CreateContextPayload;
      versionedUrl: string;
      modelTitles: string[];
    }) => {
      await createContextData(variables.body);
      if (variables.modelTitles.length > 0) {
        await addContextModelData(
          variables.versionedUrl,
          variables.modelTitles,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextKeys.all });
    },
  });
}

export function useSyncContextModelsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      contextUrl: string;
      addItem: string[];
      subItem: string[];
    }) => {
      await addContextModelData(variables.contextUrl, variables.addItem);
      await subContextModelData(variables.contextUrl, variables.subItem);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contextKeys.all });
      queryClient.invalidateQueries({
        queryKey: contextKeys.detail(variables.contextUrl),
      });
    },
  });
}

export function useDeleteContextMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contextUrl: string) => deleteContextData(contextUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextKeys.all });
    },
  });
}
