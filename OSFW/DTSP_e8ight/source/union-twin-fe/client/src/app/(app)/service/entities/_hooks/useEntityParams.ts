'use client';

import { useParams } from 'next/navigation';

export function useEntityParams() {
  const { slug } = useParams<{ slug?: string[] }>();
  return {
    contextId: slug?.[0] ? decodeURIComponent(slug[0]) : undefined,
    modelId: slug?.[1],
    entityId: slug?.[2] ? decodeURIComponent(slug[2]) : undefined,
    historyId: slug?.[3],
  };
}
