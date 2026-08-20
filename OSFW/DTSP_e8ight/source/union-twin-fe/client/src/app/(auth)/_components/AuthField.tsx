import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@e8ight/ui/utils/cn';

import type { LucideIcon } from 'lucide-react';

interface AuthFieldProps extends ComponentProps<'input'> {
  label: ReactNode;
  icon: LucideIcon;
  error?: string;
}

export function AuthField({
  label,
  icon: Icon,
  error,
  ...inputProps
}: AuthFieldProps) {
  const hasError = Boolean(error);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          className={cn(
            'focus:border-primary focus:ring-primary/10 h-12 w-full rounded-lg border px-4 py-3 pl-12 text-base text-slate-900 outline-hidden transition-all placeholder:text-slate-400 focus:ring-2 md:text-sm dark:text-slate-100 dark:placeholder:text-slate-500',
            hasError
              ? 'border-destructive bg-destructive/5'
              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
          )}
          {...inputProps}
        />
        <span className="absolute top-1/2 left-4 -translate-y-1/2">
          <Icon className="size-[18px] text-slate-400" />
        </span>
      </div>
      {error && <p className="text-destructive mt-1.5 text-xs">{error}</p>}
    </div>
  );
}
