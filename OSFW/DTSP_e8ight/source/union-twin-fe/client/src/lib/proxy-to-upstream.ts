import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { UPSTREAM_TIMEOUT_MS } from '@/lib/auth-cookies';

const MAX_PROXY_BODY_BYTES = 10 * 1024 * 1024;

const STRIP_REQUEST = new Set([
  'host',
  'connection',
  'content-length',
  'accept-encoding',
  'cookie',
]);
const STRIP_RESPONSE = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
]);

export async function proxyToUpstream(
  request: NextRequest,
  base: string | undefined,
  path: string[],
  token?: string,
) {
  if (!base) {
    return NextResponse.json(
      { error: { statusCode: 500, message: 'Upstream not configured' } },
      { status: 500 },
    );
  }

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIP_REQUEST.has(key)) headers.set(key, value);
  });
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_PROXY_BODY_BYTES) {
    return NextResponse.json(
      { error: { statusCode: 413, message: 'Payload too large' } },
      { status: 413 },
    );
  }

  const body = hasBody ? await request.arrayBuffer() : undefined;
  if (body && body.byteLength > MAX_PROXY_BODY_BYTES) {
    return NextResponse.json(
      { error: { statusCode: 413, message: 'Payload too large' } },
      { status: 413 },
    );
  }

  const url = `${base}/${path.join('/')}${request.nextUrl.search}`;

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const responseHeaders = new Headers(upstream.headers);
    STRIP_RESPONSE.forEach((header) => responseHeaders.delete(header));

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[proxy] ${request.method} ${url} failed`, error);
    return NextResponse.json(
      { error: { statusCode: 502, message: 'Upstream unreachable' } },
      { status: 502 },
    );
  }
}
