import { requireAdmin } from '@/apis/auth/auth.server';
import { NoticeEditor } from '@/app/(app)/noticeboard/_components/NoticeEditor';

export default async function NoticeWritePage() {
  await requireAdmin('/noticeboard');

  return <NoticeEditor />;
}
