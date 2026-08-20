import { Suspense } from 'react';

import {
  AccountTabs,
  AccountTabsFallback,
} from '@/app/(app)/account/_components/AccountTabs';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '내 계정',
};

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-foreground text-xl font-semibold">내 계정</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          프로필과 비밀번호를 관리합니다
        </p>
      </div>

      <Suspense fallback={<AccountTabsFallback />}>
        <AccountTabs />
      </Suspense>
    </div>
  );
}
