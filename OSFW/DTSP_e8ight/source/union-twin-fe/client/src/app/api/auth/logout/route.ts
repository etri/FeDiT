import { NextResponse } from 'next/server';

import { clearAuthCookies, getAccessToken, bffUrl } from '@/lib/auth-cookies';

export async function POST() {
  const accessToken = await getAccessToken();

  if (accessToken) {
    try {
      const res = await fetch(bffUrl('/auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        console.warn('upstream logout failed', res.status);
      }
    } catch (e: unknown) {
      console.warn('upstream logout failed', e);
    }
  }

  await clearAuthCookies();

  return NextResponse.json({ data: null });
}
