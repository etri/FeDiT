import { z } from 'zod';

export const contextSchema = z.object({
  contextId: z
    .string()
    .min(1, 'Context URI is required')
    .refine((value) => value.endsWith('.jsonld'), 'Must end with .jsonld'),
});

export type ContextFormValues = z.infer<typeof contextSchema>;
