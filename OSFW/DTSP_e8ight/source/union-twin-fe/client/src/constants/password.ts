import { z } from 'zod';

export const MAX_PASSWORD_BYTES = 72;

export const newPasswordField = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다')
  .refine(
    (value) => new TextEncoder().encode(value).length <= MAX_PASSWORD_BYTES,
    '비밀번호가 너무 깁니다 (한글은 글자당 3바이트, 최대 72바이트)',
  );
