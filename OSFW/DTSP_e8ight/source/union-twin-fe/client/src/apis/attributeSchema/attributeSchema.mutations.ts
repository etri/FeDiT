import { useMutation, useQueryClient } from '@tanstack/react-query';

import { attributeSchemaKeys } from '@/apis/attributeSchema/attributeSchema.queries';
import {
  createAttributeSchema,
  updateAttributeSchema,
} from '@/apis/attributeSchema/attributeSchemaApi';

import type {
  CreateAttributeSchemaPayload,
  UpdateAttributeSchemaPayload,
} from '@/apis/attributeSchema/attributeSchema.types';

export function useCreateAttributeSchemaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAttributeSchemaPayload) =>
      createAttributeSchema(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeSchemaKeys.all });
    },
  });
}

export function useUpdateAttributeSchemaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reqBody: UpdateAttributeSchemaPayload) =>
      updateAttributeSchema(reqBody),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: attributeSchemaKeys.all });
      queryClient.invalidateQueries({
        queryKey: attributeSchemaKeys.detail(variables.id),
      });
    },
  });
}
