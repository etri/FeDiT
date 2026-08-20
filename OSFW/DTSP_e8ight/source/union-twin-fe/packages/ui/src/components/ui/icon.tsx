import type * as React from 'react';

import * as LucideIcons from 'lucide-react';
import { type LucideIcon as LucideIconType } from 'lucide-react';

type LucideIconName = keyof typeof LucideIcons;

export interface IconProps extends Omit<
  React.ComponentPropsWithoutRef<'svg'>,
  'type'
> {
  type: LucideIconName;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

function Icon({
  type,
  size,
  color,
  strokeWidth,
  className,
  ...props
}: IconProps) {
  const IconComponent = LucideIcons[type] as LucideIconType | undefined;

  if (!IconComponent) {
    console.warn(`Icon "${String(type)}" not found in lucide-react`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}

export { Icon };
export type { LucideIconName };
