import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';

import {
  useApproveAccountDeletionMutation,
  useDeactivateUserMutation,
  useHardDeleteUserMutation,
  useRejectAccountDeletionMutation,
  useUpdateUserMutation,
} from '@/apis/admin';
import { openEditUserDialog } from '@/app/(app)/admin/users/_components/EditUserDialog';

import type { AdminRole, AdminUser } from '@/types/admin';

export function useUserActions(roles: AdminRole[]) {
  const deactivateMutation = useDeactivateUserMutation();
  const reactivateMutation = useUpdateUserMutation();
  const hardDeleteMutation = useHardDeleteUserMutation();
  const approveDeletionMutation = useApproveAccountDeletionMutation();
  const rejectDeletionMutation = useRejectAccountDeletionMutation();

  async function handleEdit(user: AdminUser) {
    await openEditUserDialog(user, roles);
  }

  async function handleHardDelete(user: AdminUser) {
    const confirmed = await openConfirmDialog({
      title: '사용자 영구 삭제',
      message: `${user.name} (${user.email}) 사용자를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '영구 삭제',
      cancelText: '취소',
    });

    if (confirmed) {
      hardDeleteMutation.mutate(user.id);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    if (user.isActive) {
      const confirmed = await openConfirmDialog({
        title: '사용자 비활성화',
        message: `${user.name} 사용자를 비활성화하시겠습니까? 해당 사용자는 더 이상 로그인할 수 없습니다.`,
        confirmText: '비활성화',
        cancelText: '취소',
      });

      if (confirmed) {
        deactivateMutation.mutate(user.id);
      }
    } else {
      const confirmed = await openConfirmDialog({
        title: '사용자 활성화',
        message: `${user.name} 사용자를 다시 활성화하시겠습니까?`,
        confirmText: '활성화',
        cancelText: '취소',
      });

      if (confirmed) {
        reactivateMutation.mutate({
          id: user.id,
          payload: { isActive: true },
        });
      }
    }
  }

  async function handleApproveDeletion(user: AdminUser) {
    const confirmed = await openConfirmDialog({
      title: '탈퇴 승인',
      message: `${user.name} (${user.email}) 님의 탈퇴를 승인하시겠습니까? 모든 회원 정보가 영구 삭제되며 되돌릴 수 없습니다.`,
      confirmText: '승인 및 영구 삭제',
      cancelText: '취소',
    });

    if (confirmed) {
      approveDeletionMutation.mutate(user.id);
    }
  }

  async function handleRejectDeletion(user: AdminUser) {
    const confirmed = await openConfirmDialog({
      title: '탈퇴 거부',
      message: `${user.name} 님의 탈퇴 요청을 거부하시겠습니까? 계정이 다시 활성화되어 로그인할 수 있게 됩니다.`,
      confirmText: '거부 및 계정 복구',
      cancelText: '취소',
    });

    if (confirmed) {
      rejectDeletionMutation.mutate(user.id);
    }
  }

  return {
    handleEdit,
    handleHardDelete,
    handleToggleActive,
    handleApproveDeletion,
    handleRejectDeletion,
  };
}
