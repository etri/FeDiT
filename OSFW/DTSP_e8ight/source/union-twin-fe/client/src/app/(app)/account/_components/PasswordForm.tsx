'use client';

import { useForm } from 'react-hook-form';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@e8ight/ui/components/ui/field';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { useChangeMyPasswordMutation, useLogoutMutation } from '@/apis/auth';
import { PasswordStrengthMeter } from '@/app/(app)/account/_components/PasswordStrengthMeter';
import {
  passwordSchema,
  type PasswordFormValues,
} from '@/app/(app)/account/_schemas/password.schema';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export function PasswordForm() {
  const changePassword = useChangeMyPasswordMutation();
  const logoutMutation = useLogoutMutation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onTouched',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const onSubmit = handleSubmit((values) => {
    changePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: async () => {
          toast.success('비밀번호가 변경되었습니다. 다시 로그인해주세요');
          reset();
          await logoutMutation.mutateAsync().catch(() => {});
          router.replace('/signin');
        },
        onError: (error) => toast.error(getAuthErrorMessage(error)),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="current-password">현재 비밀번호</FieldLabel>
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
          <FieldError errors={[errors.currentPassword]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="new-password">새 비밀번호</FieldLabel>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            {...register('newPassword')}
          />
          <PasswordStrengthMeter password={newPassword} />
          <FieldError errors={[errors.newPassword]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">새 비밀번호 확인</FieldLabel>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={changePassword.isPending}
          className="min-w-24"
        >
          {changePassword.isPending ? (
            <Spinner className="size-4" />
          ) : (
            '비밀번호 변경'
          )}
        </Button>
      </div>
    </form>
  );
}
