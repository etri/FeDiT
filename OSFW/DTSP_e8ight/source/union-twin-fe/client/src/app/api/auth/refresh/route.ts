import { NextResponse } from 'next/server';

import {
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

  if (refreshed.status === 'unavailable') {
    return NextResponse.json(
      { error: { message: 'Authentication service unavailable' } },
      { status: 503 },
    );
  }

  if (refreshed.status === 'invalid') {
    return NextResponse.json(
      { error: { message: 'Invalid or expired refresh token' } },
      { status: 401 },
    );
  }

  await setAuthCookies(refreshed.accessToken, refreshed.refreshToken);

  return NextResponse.json({ data: null });
}
