import { toast } from '@e8ight/ui/components/ui/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/apis/admin/admin.queries';
import {
  createUser,
  deactivateUser,
  hardDeleteUser,
  updateUser,
} from '@/apis/admin/adminApi';

import type { CreateUserPayload, UpdateUserPayload } from '@/types/admin';

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('사용자가 생성되었습니다');
    },
    onError: () => {
      toast.error('사용자 생성에 실패했습니다');
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('사용자 정보가 수정되었습니다');
    },
    onError: () => {
      toast.error('사용자 수정에 실패했습니다');
    },
  });
}

export function useDeactivateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('사용자가 비활성화되었습니다');
    },
    onError: () => {
      toast.error('사용자 비활성화에 실패했습니다');
    },
  });
}

export function useHardDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: hardDeleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('사용자가 영구 삭제되었습니다');
    },
    onError: () => {
      toast.error('사용자 삭제에 실패했습니다');
    },
  });
}

export function useApproveAccountDeletionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: hardDeleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('탈퇴가 승인되어 회원 정보가 영구 삭제되었습니다');
    },
    onError: () => {
      toast.error('탈퇴 승인에 실패했습니다');
    },
  });
}

export function useRejectAccountDeletionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateUser(id, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('탈퇴 요청이 거부되어 계정이 복구되었습니다');
    },
    onError: () => {
      toast.error('탈퇴 거부에 실패했습니다');
    },
  });
}
