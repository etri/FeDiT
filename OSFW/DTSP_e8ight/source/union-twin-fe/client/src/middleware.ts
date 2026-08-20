import { NextResponse } from 'next/server';

import {
  ACCESS_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  REFRESH_TOKEN_MAX_AGE,
  refreshAccessToken,
} from '@/lib/auth-cookies';

import type { NextRequest } from 'next/server';

const AUTH_ROUTES = ['/signin', '/signup'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function guardApiRequest(request: NextRequest): NextResponse {
  if (SAFE_METHODS.has(request.method)) return NextResponse.next();
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { message: 'Origin mismatch' } },
      { status: 403 },
    );
  }
  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    return guardApiRequest(request);
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const onAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (accessToken && onAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!accessToken && refreshToken && !onAuthRoute) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) {
      request.cookies.set('accessToken', refreshed.accessToken);
      request.cookies.set('refreshToken', refreshed.refreshToken);
      const response = NextResponse.next({ request });
      response.cookies.set('accessToken', refreshed.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });
      response.cookies.set('refreshToken', refreshed.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });
      return response;
    }
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  }

  if (!accessToken && !onAuthRoute) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
