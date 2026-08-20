import 'server-only';

import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import {
  getAccessToken,
  bffUrl,
  UPSTREAM_TIMEOUT_MS,
} from '@/lib/auth-cookies';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface ProxyOptions {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  invalidateTags?: readonly string[];
  searchParams?: URLSearchParams;
}

export async function proxyToBff(request: NextRequest, opts: ProxyOptions) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { data: null, error: { statusCode: 401, message: 'Unauthorized' } },
      { status: 401 },
    );
  }

  const method = opts.method ?? (request.method as HttpMethod);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  try {
    const qs = opts.searchParams?.toString();
    const url = bffUrl(opts.path) + (qs ? `?${qs}` : '');
    const res = await fetch(url, {
      method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok && opts.invalidateTags?.length) {
      for (const tag of opts.invalidateTags) revalidateTag(tag);
    }

    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { statusCode: 502, message: 'Upstream unreachable' },
      },
      { status: 502 },
    );
  }
}
