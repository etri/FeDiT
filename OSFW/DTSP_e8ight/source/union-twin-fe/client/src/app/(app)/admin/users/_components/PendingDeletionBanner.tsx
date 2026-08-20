'use client';

import { Button } from '@e8ight/ui/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { UserX } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { adminQueries } from '@/apis/admin';
import { useUsersPageStore } from '@/app/(app)/admin/users/_stores/useUsersPageStore';

export default function PendingDeletionBanner() {
  const { pendingOnly, setPendingOnly } = useUsersPageStore(
    useShallow((s) => ({
      pendingOnly: s.pendingOnly,
      setPendingOnly: s.setPendingOnly,
    })),
  );
  const { data: count = 0 } = useQuery(adminQueries.pendingDeletionCount());

  if (count === 0 && !pendingOnly) return null;

  return (
    <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <UserX className="text-destructive size-4 shrink-0" />
        <p className="text-sm">
          탈퇴 요청 <span className="text-sm font-bold">{count}건</span>이
          승인을 기다리고 있습니다
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => setPendingOnly(!pendingOnly)}
      >
        {pendingOnly ? '전체 보기' : '탈퇴 요청만 보기'}
      </Button>
    </div>
  );
}
