import { NextResponse } from 'next/server';

import { bffUrl, setAuthCookies } from '@/lib/auth-cookies';

import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(bffUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    return NextResponse.json(json, { status: res.status });
  }

  const { accessToken, refreshToken } = json;
  await setAuthCookies(accessToken, refreshToken);

  return NextResponse.json({ data: null });
}
