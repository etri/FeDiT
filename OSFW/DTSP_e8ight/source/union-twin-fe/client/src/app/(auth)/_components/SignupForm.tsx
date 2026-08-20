'use client';

import { useForm } from 'react-hook-form';

import { Button } from '@e8ight/ui/components/ui/button';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useRegisterMutation } from '@/apis/auth';
import { AuthField } from '@/app/(auth)/_components/AuthField';
import {
  registerSchema,
  type RegisterFormData,
} from '@/app/(auth)/_schemas/auth.schema';
import { getAuthErrorMessage } from '@/lib/auth-errors';

const FIELDS = [
  {
    key: 'name' as const,
    label: '이름',
    placeholder: '홍길동',
    type: 'text',
    autoComplete: 'name',
    icon: User,
  },
  {
    key: 'email' as const,
    label: '이메일',
    placeholder: 'email@example.com',
    type: 'email',
    autoComplete: 'email',
    icon: Mail,
  },
  {
    key: 'password' as const,
    label: '비밀번호',
    placeholder: '••••••••',
    type: 'password',
    autoComplete: 'new-password',
    icon: Lock,
  },
  {
    key: 'confirmPassword' as const,
    label: '비밀번호 확인',
    placeholder: '••••••••',
    type: 'password',
    autoComplete: 'new-password',
    icon: Lock,
  },
] as const;

export function SignupForm() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name,
        phoneNumber: data.phoneNumber || undefined,
      });
      toast.success('회원가입 성공');
      router.push('/');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  });

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          회원가입
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          새 계정을 생성하여 시스템에 접속하세요
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-5">
          {FIELDS.map(
            ({ key, label, placeholder, type, autoComplete, icon }) => (
              <AuthField
                key={key}
                label={label}
                icon={icon}
                error={errors[key]?.message}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                {...register(key)}
              />
            ),
          )}

          <AuthField
            label={
              <>
                연락처
                <span className="text-muted-foreground ml-1 text-xs">
                  (선택)
                </span>
              </>
            }
            icon={Phone}
            type="tel"
            placeholder="010-1234-5678"
            autoComplete="tel"
            {...register('phoneNumber')}
          />
        </div>

        <Button
          type="submit"
          className="shadow-primary/25 hover:shadow-primary/30 mt-8 h-12 w-full rounded-lg text-sm font-bold shadow-lg transition-all hover:shadow-xl"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            '회원가입'
          )}
        </Button>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/signin"
            className="text-primary hover:text-primary/80 py-2 font-semibold transition-colors"
          >
            로그인
          </Link>
        </p>
      </form>
    </>
  );
}
