'use client';

import { useEffect, useState } from 'react';

type EmbeddedAppStatus = 'loading' | 'loaded' | 'error';

export function useEmbeddedAppStatus(src: string, onLoad?: () => void) {
  const [status, setStatus] = useState<EmbeddedAppStatus>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setStatus('loading');
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
