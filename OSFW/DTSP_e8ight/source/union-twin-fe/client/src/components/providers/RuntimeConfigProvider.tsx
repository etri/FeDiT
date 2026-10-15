'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { RuntimeConfig } from '@/lib/runtime-config.types';

const RuntimeConfigContext = createContext<RuntimeConfig | null>(null);

export function RuntimeConfigProvider({
  config,
  children,
}: {
  config: RuntimeConfig;
  children: ReactNode;
}) {
  return (
    <RuntimeConfigContext.Provider value={config}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig() {
  const config = useContext(RuntimeConfigContext);
  if (!config) {
    throw new Error(
      'useRuntimeConfig must be used within RuntimeConfigProvider',
    );
  }
  return config;
}
