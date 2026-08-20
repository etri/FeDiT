import { notFound } from 'next/navigation';

import { requireAdmin } from '@/apis/auth/auth.server';
import {
  getAdminNoticeServer,
  isNoticeNotFoundError,
} from '@/apis/notices/notices.server';
import { NoticeEditor } from '@/app/(app)/noticeboard/_components/NoticeEditor';

export default async function NoticeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin('/noticeboard');

  const { id } = await params;
  try {
    const notice = await getAdminNoticeServer(id);
    return <NoticeEditor notice={notice} />;
  } catch (e) {
    if (isNoticeNotFoundError(e)) notFound();
    throw e;
  }
}
