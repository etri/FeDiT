import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authKeys, authQueries } from '@/apis/auth/auth.queries';
import {
  changeMyPassword,
  logout,
  register,
  requestAccountDeletion,
  updateMyProfile,
} from '@/apis/auth/authApi';

import type {
  ChangeMyPasswordPayload,
  RegisterPayload,
  RequestAccountDeletionPayload,
  UpdateMyProfilePayload,
} from '@/apis/auth/auth.types';

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.all }),
  });
}

export function useUpdateMyProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMyProfilePayload) => updateMyProfile(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: authQueries.me().queryKey }),
  });
}

export function useChangeMyPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangeMyPasswordPayload) => changeMyPassword(payload),
  });
}

export function useRequestAccountDeletionMutation() {
  return useMutation({
    mutationFn: (payload: RequestAccountDeletionPayload) =>
      requestAccountDeletion(payload),
  });
}
