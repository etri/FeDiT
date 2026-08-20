import '@/assets/styles/index.css';

import { Providers } from '@/app/providers';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'FEDIT',
    template: '%s | FEDIT',
  },
  description: '디지털 트윈 연합 핵심 기술 개발 사업 3세부 통합 포털',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
