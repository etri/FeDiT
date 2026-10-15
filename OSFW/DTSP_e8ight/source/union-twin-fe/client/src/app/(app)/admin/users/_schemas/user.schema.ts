import { z } from 'zod';

import { newPasswordField } from '@/constants/password';

export const ORG_NONE_VALUE = '__NONE__';
export const ORG_OTHER_VALUE = '__OTHER__';

export const createUserSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: newPasswordField,
  name: z.string().min(1, '이름을 입력해주세요'),
  organization: z.string().optional(),
  customOrganization: z.string().optional(),
  phoneNumber: z.string().optional(),
  roleId: z.string().min(1, '역할을 선택해주세요'),
  isActive: z.boolean(),
});

export const editUserSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  organization: z.string().optional(),
  customOrganization: z.string().optional(),
  phoneNumber: z.string().optional(),
  roleId: z.string().min(1, '역할을 선택해주세요'),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
export type EditUserValues = z.infer<typeof editUserSchema>;

export function resolveOrganization(
  organization: string | undefined,
  customOrganization: string | undefined,
): string | null {
  if (organization === ORG_OTHER_VALUE) {
    return customOrganization?.trim() || null;
  }
  if (!organization || organization === ORG_NONE_VALUE) {
    return null;
  }
  return organization;
}
