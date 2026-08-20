import { bffClient } from '@/apis/client';

import type {
  ChangeMyPasswordPayload,
  RegisterPayload,
  RequestAccountDeletionPayload,
  UpdateMyProfilePayload,
  UserProfile,
} from '@/apis/auth/auth.types';

const BASE = '/api/auth';

export const register = async (payload: RegisterPayload) => {
  await bffClient.post(`${BASE}/register`, payload);
};

export const logout = async () => {
  await bffClient.post(`${BASE}/logout`);
};

export const getMe = async () => {
  const { data } = await bffClient.get<UserProfile>(`${BASE}/me`);
  return data;
};

export const updateMyProfile = async (payload: UpdateMyProfilePayload) => {
  const { data } = await bffClient.patch<UserProfile>(`${BASE}/me`, payload);
  return data;
};

export const changeMyPassword = async (payload: ChangeMyPasswordPayload) => {
  await bffClient.post(`${BASE}/me/password`, payload);
};

export const requestAccountDeletion = async (
  payload: RequestAccountDeletionPayload,
) => {
  await bffClient.post(`${BASE}/me/deletion-request`, payload);
};
