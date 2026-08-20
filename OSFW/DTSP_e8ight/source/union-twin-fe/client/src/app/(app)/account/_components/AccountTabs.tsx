'use client';

import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@e8ight/ui/components/ui/tabs';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { DeleteAccountSection } from '@/app/(app)/account/_components/DeleteAccountSection';
import { PasswordForm } from '@/app/(app)/account/_components/PasswordForm';
import { ProfileForm } from '@/app/(app)/account/_components/ProfileForm';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';

const TABS = ['profile', 'password'] as const;
type AccountTab = (typeof TABS)[number];

function isAccountTab(value: string | null): value is AccountTab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

export function AccountTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: AccountTab = isAccountTab(tabParam) ? tabParam : 'profile';

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'profile') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const query = params.toString();
    router.replace(query ? `/account?${query}` : '/account');
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="max-w-2xl"
    >
      <TabsList>
        <TabsTrigger value="profile">프로필</TabsTrigger>
        <TabsTrigger value="password">비밀번호</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="pt-6">
        <ErrorBoundary fallback={<QueryErrorFallback />}>
          <Suspense clientOnly fallback={<ProfileFormSkeleton />}>
            <ProfileForm />
            <DeleteAccountSection />
          </Suspense>
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="password" className="pt-6">
        <PasswordForm />
      </TabsContent>
    </Tabs>
  );
}

export function AccountTabsFallback() {
  return (
    <div className="max-w-2xl">
      <Skeleton className="h-10 w-48" />
      <div className="pt-6">
        <ProfileFormSkeleton />
      </div>
    </div>
  );
}

function ProfileFormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
      <Skeleton className="ml-auto h-9 w-24" />
    </div>
  );
}
