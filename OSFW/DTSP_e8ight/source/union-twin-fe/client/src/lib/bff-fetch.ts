import 'server-only';

import { redirect } from 'next/navigation';

import { getAccessToken, bffUrl } from '@/lib/auth-cookies';

export async function fetchBff(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  if (!accessToken) redirect('/signin');

  const res = await fetch(bffUrl(path), {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401) redirect('/signin');
  return res;
}
