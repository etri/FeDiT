import { useMutation, useQueryClient } from '@tanstack/react-query';

import { translatorKeys } from '@/apis/translator/translator.queries';
import {
  createTranslator,
  deleteTranslator,
  patchTranslatorControl,
  postTranslatorCompile,
} from '@/apis/translator/translatorApi';

import type {
  TranslatorCompileRequest,
  TranslatorControlRequest,
  TranslatorCreateRequest,
} from '@/apis/translator/translator.types';

export function useCreateTranslatorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TranslatorCreateRequest) => createTranslator(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translatorKeys.all });
    },
  });
}

export function useDeleteTranslatorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (translatorId: number) => deleteTranslator(translatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translatorKeys.all });
    },
  });
}

export function usePatchTranslatorControlMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      translatorId: number;
      payload: TranslatorControlRequest;
    }) => patchTranslatorControl(variables.translatorId, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translatorKeys.all });
    },
  });
}

export function useCompileTranslatorMutation() {
  return useMutation({
    mutationFn: (payload: TranslatorCompileRequest) =>
      postTranslatorCompile(payload),
  });
}
