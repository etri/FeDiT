import { requireAdmin } from '@/apis/auth/auth.server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin('/');

  return <>{children}</>;
}
