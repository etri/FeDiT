import { useMutation, useQueryClient } from '@tanstack/react-query';

import { translatorKeys } from '@/apis/translator/translator.queries';
import {
  createTranslator,
  deleteTranslator,
  patchTranslatorControl,
  postTranslatorCompile,
  postTranslatorTest,
  updateTranslator,
} from '@/apis/translator/translatorApi';

import type {
  TranslatorCompileRequest,
  TranslatorControlRequest,
  TranslatorCreateRequest,
  TranslatorTestRequest,
  TranslatorUpdateRequest,
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

export function useUpdateTranslatorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      translatorId: number;
      payload: TranslatorUpdateRequest;
    }) => updateTranslator(variables.translatorId, variables.payload),
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

export function useTestTranslatorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      translatorId: number;
      payload: TranslatorTestRequest;
    }) => postTranslatorTest(variables.translatorId, variables.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translatorKeys.lists() });
    },
  });
}
