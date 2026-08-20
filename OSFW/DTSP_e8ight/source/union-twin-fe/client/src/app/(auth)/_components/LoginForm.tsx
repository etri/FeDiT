'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@e8ight/ui/components/ui/button';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AuthField } from '@/app/(auth)/_components/AuthField';
import {
  loginSchema,
  type LoginFormData,
} from '@/app/(auth)/_schemas/auth.schema';
import { loginAction } from '@/app/(auth)/signin/_actions/login';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await loginAction(data);
      if (result.ok) {
        toast.success('로그인 성공');
        router.push('/');
      } else {
        toast.error(getAuthErrorMessage(result.errorCode));
      }
    });
  });

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          로그인
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          계정에 로그인하여 시스템에 접속하세요
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-5">
          <AuthField
            label="이메일"
            icon={Mail}
            error={errors.email?.message}
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            {...register('email')}
          />

          <AuthField
            label="비밀번호"
            icon={Lock}
            error={errors.password?.message}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
          />
        </div>

        <Button
          type="submit"
          className="shadow-primary/25 hover:shadow-primary/30 mt-8 h-12 w-full rounded-lg text-sm font-bold shadow-lg transition-all hover:shadow-xl"
          disabled={isPending}
        >
          {isPending ? <Spinner className="size-4" /> : '로그인'}
        </Button>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          계정이 없으신가요?{' '}
          <Link
            href="/signup"
            className="text-primary hover:text-primary/80 py-2 font-semibold transition-colors"
          >
            회원가입
          </Link>
        </p>
      </form>
    </>
  );
}
