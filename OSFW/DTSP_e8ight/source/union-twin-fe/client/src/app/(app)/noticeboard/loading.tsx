import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

import { NoticesListSkeleton } from '@/app/(app)/noticeboard/_components/NoticesList';

export default function NoticeboardLoading() {
  return (
    <div className="flex w-full flex-col gap-8 px-8 py-10">
      <header className="flex flex-col gap-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </header>
      <NoticesListSkeleton />
    </div>
  );
}
