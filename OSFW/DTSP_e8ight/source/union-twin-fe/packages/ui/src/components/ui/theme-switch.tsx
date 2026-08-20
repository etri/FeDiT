import type { ComponentProps } from 'react';

import { Button } from './button';
import { Icon } from './icon';
import { cn } from '../../utils/cn';
import { useTheme } from '../theme-provider';

interface ThemeSwitchProps {
  size?: ComponentProps<typeof Button>['size'];
  variant?: ComponentProps<typeof Button>['variant'];
  className?: string;
}

function ThemeSwitch({
  size = 'icon',
  variant = 'ghost',
  className,
}: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme();

  function handleToggle() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className={cn('text-muted-foreground hover:text-foreground', className)}
    >
      <Icon type={theme === 'dark' ? 'Sun' : 'Moon'} className="size-4" />
    </Button>
  );
}

export { ThemeSwitch };
export type { ThemeSwitchProps };
