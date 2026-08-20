'use client';

import { useForm } from 'react-hook-form';

import { Button } from '@e8ight/ui/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSuspenseQuery } from '@tanstack/react-query';

import { authQueries, useUpdateMyProfileMutation } from '@/apis/auth';
import {
  profileSchema,
  type ProfileFormValues,
} from '@/app/(app)/account/_schemas/profile.schema';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export function ProfileForm() {
  const { data: user } = useSuspenseQuery(authQueries.me());
  const updateProfile = useUpdateMyProfileMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      name: user.name,
      phoneNumber: user.phoneNumber ?? '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    updateProfile.mutate(
      {
        name: values.name,
        phoneNumber: values.phoneNumber || null,
      },
      {
        onSuccess: () => toast.success('프로필이 업데이트되었습니다'),
        onError: (error) => toast.error(getAuthErrorMessage(error)),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="profile-email">이메일</FieldLabel>
          <Input id="profile-email" value={user.email} readOnly />
          <FieldDescription>이메일은 변경할 수 없습니다</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-name">이름</FieldLabel>
          <Input
            id="profile-name"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-phone">연락처</FieldLabel>
          <Input
            id="profile-phone"
            type="tel"
            placeholder="010-1234-5678"
            {...register('phoneNumber')}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="profile-org">소속 기관</FieldLabel>
          <Input id="profile-org" value={user.organization ?? ''} readOnly />
          <FieldDescription>
            소속 변경은 관리자에게 문의해주세요
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || updateProfile.isPending}
          className="min-w-24"
        >
          {updateProfile.isPending ? <Spinner className="size-4" /> : '저장'}
        </Button>
      </div>
    </form>
  );
}
