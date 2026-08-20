import { useMutation, useQueryClient } from '@tanstack/react-query';

import { attributeKeys } from '@/apis/attribute/attribute.queries';
import {
  deleteAttrData,
  postAttrData,
  putAttrData,
} from '@/apis/attribute/attributeApi';

export function usePostAttrMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postAttrData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.all });
    },
  });
}

export function usePutAttrMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: putAttrData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.all });
    },
  });
}

export function useDeleteAttrMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAttrData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.all });
    },
  });
}
