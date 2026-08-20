'use client';

import { Controller, useForm } from 'react-hook-form';

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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@e8ight/ui/components/ui/field';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { overlay } from 'overlay-kit';

import { adminQueries, useUpdateUserMutation } from '@/apis/admin';
import { OrganizationSelect } from '@/app/(app)/admin/users/_components/OrganizationSelect';
import {
  editUserSchema,
  ORG_NONE_VALUE,
  ORG_OTHER_VALUE,
  resolveOrganization,
} from '@/app/(app)/admin/users/_schemas/user.schema';

import type { EditUserValues } from '@/app/(app)/admin/users/_schemas/user.schema';
import type { AdminOrganization, AdminRole, AdminUser } from '@/types/admin';

function EditUserForm({
  user,
  roles,
  organizations,
  onClose,
}: {
  user: AdminUser;
  roles: AdminRole[];
  organizations: AdminOrganization[];
  onClose: (result: boolean) => void;
}) {
  const updateUser = useUpdateUserMutation();

  const isKnownOrg =
    !user.organization ||
    organizations.some((o) => o.name === user.organization);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    mode: 'onTouched',
    defaultValues: {
      name: user.name,
      organization: isKnownOrg
        ? (user.organization ?? ORG_NONE_VALUE)
        : ORG_OTHER_VALUE,
      customOrganization: isKnownOrg ? '' : (user.organization ?? ''),
      phoneNumber: user.phoneNumber ?? '',
      roleId: user.role.id,
    },
  });

  const isOtherOrg = watch('organization') === ORG_OTHER_VALUE;

  const onSubmit = handleSubmit((values) => {
    updateUser.mutate(
      {
        id: user.id,
        payload: {
          name: values.name,
          organization: resolveOrganization(
            values.organization,
            values.customOrganization,
          ),
          phoneNumber: values.phoneNumber || null,
          roleId: values.roleId,
        },
      },
      { onSuccess: () => onClose(true) },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <FieldGroup className="min-h-0 flex-1 overflow-y-auto">
        <FieldSet>
          <FieldLegend variant="label">신원 정보</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-user-email">이메일</FieldLabel>
              <Input id="edit-user-email" value={user.email} disabled />
              <FieldDescription>이메일은 변경할 수 없습니다</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-user-name">이름</FieldLabel>
              <Input
                id="edit-user-name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-user-phone">연락처</FieldLabel>
              <Input
                id="edit-user-phone"
                type="tel"
                placeholder="010-1234-5678"
                {...register('phoneNumber')}
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">소속</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-user-org">소속 기관</FieldLabel>
              <Controller
                control={control}
                name="organization"
                render={({ field }) => (
                  <OrganizationSelect
                    id="edit-user-org"
                    value={field.value || ORG_NONE_VALUE}
                    onChange={field.onChange}
                    organizations={organizations}
                  />
                )}
              />
            </Field>

            {isOtherOrg && (
              <Field>
                <FieldLabel htmlFor="edit-user-custom-org">
                  기관명 직접 입력
                </FieldLabel>
                <Input
                  id="edit-user-custom-org"
                  placeholder="기관명을 입력하세요"
                  {...register('customOrganization')}
                />
              </Field>
            )}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">계정 권한</FieldLegend>
          <Field>
            <FieldLabel htmlFor="edit-user-role">역할</FieldLabel>
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="edit-user-role">
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.roleId]} />
          </Field>
        </FieldSet>
      </FieldGroup>

      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
          >
            취소
          </Button>
        </DialogClose>
        <Button type="submit" disabled={updateUser.isPending}>
          {updateUser.isPending ? <Spinner className="size-4" /> : '저장'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditUserFormLoader({
  user,
  roles,
  onClose,
}: {
  user: AdminUser;
  roles: AdminRole[];
  onClose: (result: boolean) => void;
}) {
  const { data: organizations, isPending } = useQuery(
    adminQueries.organizations(),
  );

  if (isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="text-muted-foreground size-5" />
      </div>
    );
  }

  return (
    <EditUserForm
      user={user}
      roles={roles}
      organizations={organizations ?? []}
      onClose={onClose}
    />
  );
}

export function openEditUserDialog(user: AdminUser, roles: AdminRole[]) {
  return overlay.openAsync<boolean>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close(false)}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>사용자 수정</DialogTitle>
          <DialogDescription>사용자 정보와 역할을 수정합니다</DialogDescription>
        </DialogHeader>
        <EditUserFormLoader user={user} roles={roles} onClose={close} />
      </DialogContent>
    </Dialog>
  ));
}
