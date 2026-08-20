'use client';

import { Button } from '@e8ight/ui/components/ui/button';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { authQueries, useLogoutMutation } from '@/apis/auth';
import { openDeleteAccountDialog } from '@/app/(app)/account/_components/DeleteAccountDialog';

export function DeleteAccountSection() {
  const router = useRouter();
  const { data: user } = useSuspenseQuery(authQueries.me());
  const logoutMutation = useLogoutMutation();

  if (user.role.name === 'ADMIN') return null;

  async function handleDeleteAccount() {
    const requested = await openDeleteAccountDialog();
    if (!requested) return;

    toast.success('탈퇴 요청이 접수되었습니다');
    await logoutMutation.mutateAsync().catch(() => {});
    router.replace('/signin');
  }

  return (
    <section className="border-destructive/30 mt-10 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-destructive text-sm font-semibold">회원탈퇴</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          탈퇴 요청 시 계정이 즉시 비활성화되며, 관리자 승인 후 모든 회원 정보가
          영구 삭제됩니다.
        </p>
      </div>
      <Button
        variant="outline"
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
        onClick={handleDeleteAccount}
      >
        회원탈퇴
      </Button>
    </section>
  );
}
