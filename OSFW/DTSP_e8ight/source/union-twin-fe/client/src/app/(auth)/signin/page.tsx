import { LoginForm } from '@/app/(auth)/_components/LoginForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  description: '계정에 로그인하여 시스템에 접속하세요.',
};

export default function SignInPage() {
  return <LoginForm />;
}
