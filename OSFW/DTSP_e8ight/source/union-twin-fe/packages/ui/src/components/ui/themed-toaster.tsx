import { Toaster } from './sonner';
import { useTheme } from '../theme-provider';

import type { ToasterProps } from 'sonner';

export function ThemedToaster(props: Omit<ToasterProps, 'theme'>) {
  const { resolvedTheme } = useTheme();

  return <Toaster theme={resolvedTheme} {...props} />;
}
