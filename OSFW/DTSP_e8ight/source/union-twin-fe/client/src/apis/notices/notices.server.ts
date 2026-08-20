import 'server-only';

import { bffUrl } from '@/lib/auth-cookies';
import { fetchBff } from '@/lib/bff-fetch';
import { NOTICES_TAG } from '@/lib/revalidation-tags';

import type { AdminPaginatedResponse } from '@/types/admin';
import type { Notice, NoticeListParams } from '@/types/noticeboard';

class NoticeNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Notice not found: ${id}`);
    this.name = 'NoticeNotFoundError';
  }
}

export function isNoticeNotFoundError(e: unknown): e is NoticeNotFoundError {
  return e instanceof NoticeNotFoundError;
}

const BFF_BASE = '/notices';

function buildQuery(params: NoticeListParams | undefined) {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) search.set(k, String(v));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function getNoticesServer(params: NoticeListParams) {
  const res = await fetch(bffUrl(`${BFF_BASE}${buildQuery(params)}`), {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60, tags: [NOTICES_TAG] },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch notices: ${res.status}`);
  }
  return (await res.json()) as AdminPaginatedResponse<Notice>;
}

export async function getNoticeServer(id: string) {
  const res = await fetch(bffUrl(`${BFF_BASE}/${id}`), {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60, tags: [NOTICES_TAG] },
  });
  if (res.status === 404) throw new NoticeNotFoundError(id);
  if (!res.ok) {
    throw new Error(`Failed to fetch notice: ${res.status}`);
  }
  return (await res.json()) as Notice;
}

export async function getAdminNoticeServer(id: string) {
  const res = await fetchBff(`${BFF_BASE}/admin/${id}`, { cache: 'no-store' });
  if (res.status === 404) throw new NoticeNotFoundError(id);
  if (!res.ok) {
    throw new Error(`Failed to fetch notice: ${res.status}`);
  }
  return (await res.json()) as Notice;
}

export async function getAdminNoticesServer(params: NoticeListParams) {
  const res = await fetchBff(`${BFF_BASE}/admin${buildQuery(params)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch admin notices: ${res.status}`);
  }
  return (await res.json()) as AdminPaginatedResponse<Notice>;
}
