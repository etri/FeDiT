import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phoneNumber: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
