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
  FieldContent,
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
import { Switch } from '@e8ight/ui/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { overlay } from 'overlay-kit';

import { adminQueries, useCreateUserMutation } from '@/apis/admin';
import { OrganizationSelect } from '@/app/(app)/admin/users/_components/OrganizationSelect';
import {
  createUserSchema,
  ORG_NONE_VALUE,
  ORG_OTHER_VALUE,
  resolveOrganization,
} from '@/app/(app)/admin/users/_schemas/user.schema';
import { PasswordInput } from '@/components/ui/PasswordInput';

import type { CreateUserValues } from '@/app/(app)/admin/users/_schemas/user.schema';
import type { AdminRole } from '@/types/admin';

function CreateUserForm({
  roles,
  onClose,
}: {
  roles: AdminRole[];
  onClose: (result: boolean) => void;
}) {
  const createUser = useCreateUserMutation();
  const { data: organizations = [], isLoading: orgsLoading } = useQuery(
    adminQueries.organizations(),
  );
  const defaultRoleId =
    roles.find((role) => role.name === 'VIEWER')?.id ?? roles[0]?.id ?? '';

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      name: '',
      organization: ORG_NONE_VALUE,
      customOrganization: '',
      phoneNumber: '',
      roleId: defaultRoleId,
      isActive: true,
    },
  });

  const isOtherOrg = watch('organization') === ORG_OTHER_VALUE;

  const onSubmit = handleSubmit((values) => {
    createUser.mutate(
      {
        email: values.email,
        password: values.password,
        name: values.name,
        organization: resolveOrganization(
          values.organization,
          values.customOrganization,
        ),
        phoneNumber: values.phoneNumber || null,
        roleId: values.roleId,
        isActive: values.isActive,
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
              <FieldLabel htmlFor="new-user-email">이메일</FieldLabel>
              <Input
                id="new-user-email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="new-user-name">이름</FieldLabel>
              <Input
                id="new-user-name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="new-user-phone">연락처</FieldLabel>
              <Input
                id="new-user-phone"
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
              <FieldLabel htmlFor="new-user-org">소속 기관</FieldLabel>
              {orgsLoading ? (
                <div className="flex h-8 items-center">
                  <Spinner className="size-4" />
                </div>
              ) : (
                <Controller
                  control={control}
                  name="organization"
                  render={({ field }) => (
                    <OrganizationSelect
                      id="new-user-org"
                      value={field.value || ORG_NONE_VALUE}
                      onChange={field.onChange}
                      organizations={organizations}
                    />
                  )}
                />
              )}
            </Field>

            {isOtherOrg && (
              <Field>
                <FieldLabel htmlFor="new-user-custom-org">
                  기관명 직접 입력
                </FieldLabel>
                <Input
                  id="new-user-custom-org"
                  placeholder="기관명을 입력하세요"
                  {...register('customOrganization')}
                />
              </Field>
            )}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">계정 권한</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-user-password">초기 비밀번호</FieldLabel>
              <PasswordInput
                id="new-user-password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="new-user-role">역할</FieldLabel>
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="new-user-role">
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

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="new-user-active">활성 계정</FieldLabel>
                <FieldDescription>
                  비활성 사용자는 로그인할 수 없습니다
                </FieldDescription>
              </FieldContent>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    id="new-user-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>
          </FieldGroup>
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
        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? <Spinner className="size-4" /> : '생성'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function openCreateUserDialog(roles: AdminRole[]) {
  return overlay.openAsync<boolean>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close(false)}>
      <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>사용자 생성</DialogTitle>
          <DialogDescription>
            관리자 권한으로 새 사용자 계정과 역할을 생성합니다
          </DialogDescription>
        </DialogHeader>
        <CreateUserForm roles={roles} onClose={close} />
      </DialogContent>
    </Dialog>
  ));
}
