import { InnerLayout } from '@/components/layout/InnerLayout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <InnerLayout>{children}</InnerLayout>;
}
