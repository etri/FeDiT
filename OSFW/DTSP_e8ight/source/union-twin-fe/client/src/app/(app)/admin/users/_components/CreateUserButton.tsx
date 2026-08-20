'use client';

import { Button } from '@e8ight/ui/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { adminQueries } from '@/apis/admin';
import { openCreateUserDialog } from '@/app/(app)/admin/users/_components/CreateUserDialog';

export default function CreateUserButton() {
  const { data: roles = [], isLoading } = useQuery(adminQueries.roleList());

  return (
    <Button
      type="button"
      onClick={() => openCreateUserDialog(roles)}
      disabled={isLoading || roles.length === 0}
    >
      <Plus className="size-4" />
      사용자 생성
    </Button>
  );
}
