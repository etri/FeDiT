'use client';

import { useEffect, useState } from 'react';

type EmbeddedAppStatus =
  'checking' | 'loading' | 'loaded' | 'error' | 'blocked';

export function useEmbeddedAppStatus(src: string, onLoad?: () => void) {
  const [status, setStatus] = useState<EmbeddedAppStatus>('checking');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const isMixedContent =
      window.location.protocol === 'https:' && src.startsWith('http://');
    setStatus(isMixedContent ? 'blocked' : 'loading');
  }, [src, reloadKey]);

  function handleLoad() {
    setStatus('loaded');
    onLoad?.();
  }

  function handleError() {
    setStatus('error');
  }

  function retry() {
    setReloadKey((k) => k + 1);
  }

  return {
    status,
    reloadKey,
    onLoad: handleLoad,
    onError: handleError,
    retry,
  };
}
