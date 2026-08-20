import { z } from 'zod';

import { ATTRIBUTE_VALUE_TYPES } from '@/constants/dataModelValueTypes';

export const attributeSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  type: z.string(),
  valueType: z.enum(ATTRIBUTE_VALUE_TYPES),
  title: z.string(),
  description: z.string(),
  format: z.string(),
});

export type AttributeFormValues = z.infer<typeof attributeSchema>;
