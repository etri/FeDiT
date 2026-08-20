import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
  path: '/',
};

export const ACCESS_TOKEN_MAX_AGE = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export const UPSTREAM_TIMEOUT_MS = 30_000;

export function bffUrl(path: string) {
  const base = process.env.UNION_TWIN_BFF_URL;
  if (!base) throw new Error('UNION_TWIN_BFF_URL is not set');
  return `${base}/api${path}`;
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
) {
  const cookieStore = await cookies();
  cookieStore.set('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  cookieStore.set('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

export async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value;
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get('refreshToken')?.value;
}

async function isAccessTokenValid(accessToken: string) {
  try {
    const res = await fetch(bffUrl('/auth/me'), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function requireSessionCookies(): Promise<NextResponse | null> {
  const accessToken = await getAccessToken();
  if (accessToken && (await isAccessTokenValid(accessToken))) return null;

  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) {
      await setAuthCookies(refreshed.accessToken, refreshed.refreshToken);
      return null;
    }
  }

  return NextResponse.json(
    { data: null, error: { statusCode: 401, message: 'Unauthorized' } },
    { status: 401 },
  );
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const res = await fetch(bffUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    return {
      accessToken: json.accessToken,
      refreshToken: json.refreshToken,
    };
  } catch {
    return null;
  }
}
