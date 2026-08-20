import { z } from 'zod';

export const dataModelSchema = z.object({
  id: z.string(),
  type: z
    .string()
    .min(1, 'Type is required')
    .regex(/^[A-Z]/, 'Type must start with a capital letter.'),
  title: z.string(),
  description: z.string(),
  reference: z.array(z.string()),
});

export type DataModelFormValues = z.infer<typeof dataModelSchema>;
