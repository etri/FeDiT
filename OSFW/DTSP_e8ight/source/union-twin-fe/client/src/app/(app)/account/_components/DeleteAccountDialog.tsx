'use client';

import { useForm } from 'react-hook-form';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@e8ight/ui/components/ui/field';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { overlay } from 'overlay-kit';
import { z } from 'zod';

import { useRequestAccountDeletionMutation } from '@/apis/auth';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { getAuthErrorMessage } from '@/lib/auth-errors';

const deleteAccountSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;

function DeleteAccountForm({
  onClose,
}: {
  onClose: (result: boolean) => void;
}) {
  const requestDeletion = useRequestAccountDeletionMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    mode: 'onTouched',
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    requestDeletion.mutate(values, {
      onSuccess: () => onClose(true),
      onError: (error) =>
        setError('password', { message: getAuthErrorMessage(error) }),
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="delete-account-password">비밀번호 확인</FieldLabel>
        <PasswordInput
          id="delete-account-password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        <FieldError errors={[errors.password]} />
      </Field>

      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
          >
            취소
          </Button>
        </DialogClose>
        <Button
          type="submit"
          variant="destructive"
          disabled={requestDeletion.isPending}
        >
          {requestDeletion.isPending ? (
            <Spinner className="size-4" />
          ) : (
            '탈퇴 요청'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function openDeleteAccountDialog() {
  return overlay.openAsync<boolean>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>회원탈퇴</DialogTitle>
          <DialogDescription>
            탈퇴를 요청하면 계정이 즉시 비활성화되고 로그아웃됩니다. 관리자 승인
            후 모든 회원 정보가 영구 삭제되며, 승인된 후에는 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DeleteAccountForm onClose={close} />
      </DialogContent>
    </Dialog>
  ));
}
