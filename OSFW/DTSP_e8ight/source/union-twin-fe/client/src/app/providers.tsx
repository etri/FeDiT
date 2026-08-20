'use client';

import { Toaster } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { TooltipProvider } from '@e8ight/ui/components/ui/tooltip';
import { GlobalPortal } from '@e8ight/ui/contexts/GlobalPortal';
import { DefaultProps, DefaultPropsProvider, Delay } from '@suspensive/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Agentation } from 'agentation';
import { ThemeProvider, useTheme } from 'next-themes';
import { OverlayProvider } from 'overlay-kit';

import { getQueryClient } from '@/lib/get-query-client';

const suspensiveDefaultProps = new DefaultProps({
  Suspense: {
    fallback: (
      <Delay>
        <div className="flex size-full items-center justify-center py-8">
          <Spinner className="size-6" />
        </div>
      </Delay>
    ),
  },
  Delay: { ms: 200 },
});

function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <DefaultPropsProvider defaultProps={suspensiveDefaultProps}>
          <TooltipProvider>
            <GlobalPortal.Provider>
              <OverlayProvider>
                <div className="h-svh" id="app">
                  {children}
                </div>
                <ThemedToaster />
                {process.env.NODE_ENV === 'development' && <Agentation />}
              </OverlayProvider>
            </GlobalPortal.Provider>
          </TooltipProvider>
        </DefaultPropsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
