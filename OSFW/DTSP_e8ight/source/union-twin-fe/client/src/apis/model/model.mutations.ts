import { useMutation, useQueryClient } from '@tanstack/react-query';

import { modelKeys } from '@/apis/model/model.queries';
import {
  deleteModel,
  postModelData,
  postModelVersionUp,
  putIsReady,
  putModel,
} from '@/apis/model/modelApi';

export function usePostModelMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postModelData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelKeys.all });
    },
  });
}

export function usePutModelMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: putModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelKeys.all });
    },
  });
}

export function useDeleteModelMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelKeys.all });
    },
  });
}

export function usePostModelVersionUpMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postModelVersionUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelKeys.all });
    },
  });
}

export function usePutModelReadyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: putIsReady,
    onSuccess: (_data, dataModelId) => {
      queryClient.invalidateQueries({ queryKey: modelKeys.all });
      queryClient.invalidateQueries({
        queryKey: modelKeys.detail(dataModelId),
      });
    },
  });
}
