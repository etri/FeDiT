import { NextResponse } from 'next/server';

import {
  clearAuthCookies,
  getRefreshToken,
  refreshAccessToken,
  setAuthCookies,
} from '@/lib/auth-cookies';

export async function POST() {
  const refreshTokenValue = await getRefreshToken();

  if (!refreshTokenValue) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
  }

  const refreshed = await refreshAccessToken(refreshTokenValue);

  if (!refreshed) {
    await clearAuthCookies();
    return NextResponse.json(
      { error: { message: 'Invalid or expired refresh token' } },
      { status: 401 },
    );
  }

  await setAuthCookies(refreshed.accessToken, refreshed.refreshToken);

  return NextResponse.json({ data: null });
}
