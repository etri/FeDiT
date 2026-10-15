'use server';

import { headers } from 'next/headers';

import {
  loginSchema,
  type LoginFormData,
} from '@/app/(auth)/_schemas/auth.schema';
import { setAuthCookies, bffUrl } from '@/lib/auth-cookies';

type LoginActionResult = { ok: true } | { ok: false; errorCode: string };

export async function loginAction(
  data: LoginFormData,
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, errorCode: 'INVALID_INPUT' };
  }

  const headerStore = await headers();
  const forwardedFor = headerStore.get('x-forwarded-for');

  const res = await fetch(bffUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
    },
    body: JSON.stringify(parsed.data),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorCode =
      json?.error?.errorCode ??
      (res.status === 429 ? 'TOO_MANY_ATTEMPTS' : 'UNKNOWN_ERROR');
    return { ok: false, errorCode };
  }

  const { accessToken, refreshToken } = json;
  await setAuthCookies(accessToken, refreshToken);

  return { ok: true };
}
