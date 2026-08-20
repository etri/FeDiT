import { z } from 'zod';

export const translatorCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  modelType: z.string().min(1),
  sourceTopic: z.string().min(1, 'Source topic is required'),
  translateCode: z.string(),
});

export type TranslatorCreateFormValues = z.infer<typeof translatorCreateSchema>;
