import { useMutation, useQueryClient } from '@tanstack/react-query';

import { contextKeys } from '@/apis/context/context.queries';
import {
  addContextModelData,
  createContextData,
  deleteContextData,
  getContextData,
  getContextDetailData,
  subContextModelData,
} from '@/apis/context/contextApi';

import type { CreateContextPayload } from '@/types/context';

const NGSI_LD_MODEL_IRI_PREFIX = 'https://uri.etsi.org/ngsi-ld/';

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

export function useReenrollContextModelMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelType: string) => {
      const contextUrls = await getContextData();
      const details = await Promise.all(
        contextUrls.map(async (contextUrl) => ({
          contextUrl,
          detail: await getContextDetailData(contextUrl),
        })),
      );

      const enrolledUrls = details
        .filter(({ detail }) =>
          Boolean(
            detail['@context']?.[modelType]?.startsWith(
              NGSI_LD_MODEL_IRI_PREFIX,
            ),
          ),
        )
        .map(({ contextUrl }) => contextUrl);

      for (const contextUrl of enrolledUrls) {
        await subContextModelData(contextUrl, [modelType]);
        await addContextModelData(contextUrl, [modelType]);
      }

      return enrolledUrls;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contextKeys.all });
    },
  });
}
