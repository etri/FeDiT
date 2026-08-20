import 'server-only';

import { redirect } from 'next/navigation';

import { fetchBff } from '@/lib/bff-fetch';

import type { UserProfile } from '@/apis/auth/auth.types';

export async function requireAdmin(redirectTo: string): Promise<void> {
  const res = await fetchBff('/auth/me');
  const me = (await res.json()) as Pick<UserProfile, 'role'>;
  if (me.role.name !== 'ADMIN') redirect(redirectTo);
}
