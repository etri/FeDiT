import { bffClient } from '@/apis/client';

import type { AdminPaginatedResponse } from '@/types/admin';
import type {
  CreateNoticePayload,
  Notice,
  NoticeListParams,
  UpdateNoticePayload,
} from '@/types/noticeboard';

const BASE = '/api/notices';

export async function getNotices(params: NoticeListParams) {
  const { data } = await bffClient.get<AdminPaginatedResponse<Notice>>(BASE, {
    params,
  });
  return data;
}

export async function getNotice(id: string) {
  const { data } = await bffClient.get<Notice>(`${BASE}/${id}`);
  return data;
}

export async function createNotice(payload: CreateNoticePayload) {
  const { data } = await bffClient.post<Notice>(BASE, payload);
  return data;
}

export async function updateNotice(id: string, payload: UpdateNoticePayload) {
  const { data } = await bffClient.patch<Notice>(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteNotice(id: string) {
  await bffClient.delete(`${BASE}/${id}`);
}

export async function publishNotice(id: string) {
  const { data } = await bffClient.patch<Notice>(`${BASE}/${id}/publish`);
  return data;
}

export async function pinNotice(id: string) {
  const { data } = await bffClient.patch<Notice>(`${BASE}/${id}/pin`);
  return data;
}

export async function getAdminNotices(params: NoticeListParams) {
  const { data } = await bffClient.get<AdminPaginatedResponse<Notice>>(
    `${BASE}/admin`,
    { params },
  );
  return data;
}
