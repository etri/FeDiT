'use client';

import type { ReactNode } from 'react';

import { useMetadataCartListener } from '@/app/(app)/metadata/_hooks/useMetadataCartListener';

export default function MetadataLayout({ children }: { children: ReactNode }) {
  useMetadataCartListener();
  return children;
}
