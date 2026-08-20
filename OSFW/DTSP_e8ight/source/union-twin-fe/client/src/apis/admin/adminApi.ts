import { bffClient } from '@/apis/client';

import type {
  AdminOrganization,
  AdminRole,
  AdminUser,
  CreateUserPayload,
  AdminPaginatedResponse,
  UpdateUserPayload,
  UsersListParams,
} from '@/types/admin';

const BASE = '/api/admin';

export async function getUsers(params: UsersListParams) {
  const { data } = await bffClient.get<AdminPaginatedResponse<AdminUser>>(
    `${BASE}/users`,
    { params },
  );
  return data;
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await bffClient.post<AdminUser>(`${BASE}/users`, payload);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const { data } = await bffClient.patch<AdminUser>(
    `${BASE}/users/${id}`,
    payload,
  );
  return data;
}

export async function deactivateUser(id: string) {
  const { data } = await bffClient.delete<AdminUser>(`${BASE}/users/${id}`);
  return data;
}

export async function hardDeleteUser(id: string) {
  await bffClient.delete(`${BASE}/users/${id}/permanent`);
}

export async function getRoles() {
  const { data } = await bffClient.get<AdminRole[]>(`${BASE}/roles`);
  return data;
}

export async function getOrganizations() {
  const { data } = await bffClient.get<AdminOrganization[]>(
    `${BASE}/organizations`,
  );
  return data;
}
