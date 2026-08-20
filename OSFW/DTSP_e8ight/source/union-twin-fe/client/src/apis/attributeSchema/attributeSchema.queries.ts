import { queryOptions } from '@tanstack/react-query';

import {
  getAttributeAtAttributeSchema,
  getAttributeSchemaList,
} from '@/apis/attributeSchema/attributeSchemaApi';

export const attributeSchemaKeys = {
  all: ['attributeSchema'] as const,
  lists: () => [...attributeSchemaKeys.all, 'list'] as const,
  details: () => [...attributeSchemaKeys.all, 'detail'] as const,
  detail: (schemaId: string) =>
    [...attributeSchemaKeys.details(), schemaId] as const,
} as const;

export const attributeSchemaQueries = {
  list: () =>
    queryOptions({
      queryKey: attributeSchemaKeys.lists(),
      queryFn: getAttributeSchemaList,
    }),

  detail: (schemaId: string) =>
    queryOptions({
      queryKey: attributeSchemaKeys.detail(schemaId),
      queryFn: () => getAttributeAtAttributeSchema(schemaId),
      enabled: Boolean(schemaId),
    }),
} as const;
