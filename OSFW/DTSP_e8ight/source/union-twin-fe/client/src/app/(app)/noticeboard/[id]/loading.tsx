import { NoticeDetailSkeleton } from '@/app/(app)/noticeboard/[id]/_components/NoticeDetail';

export default function NoticeDetailLoading() {
  return (
    <div className="p-6">
      <NoticeDetailSkeleton />
    </div>
  );
}
