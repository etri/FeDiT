import { z } from 'zod';

import { newPasswordField } from '@/constants/password';

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: '새 비밀번호와 일치하지 않습니다',
      });
    }
    if (
      data.currentPassword &&
      data.newPassword &&
      data.currentPassword === data.newPassword
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: '현재 비밀번호와 다른 비밀번호를 사용해주세요',
      });
    }
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;
