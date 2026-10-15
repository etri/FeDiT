import type { ChangeEvent } from 'react';

import { Checkbox } from '@e8ight/ui/components/ui/checkbox';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { cn } from 'cn';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface InputRendererProps {
  type: 'text' | 'number' | 'select' | 'checkbox';
  value: unknown;
  onChange: (value: unknown) => void;
  error?: boolean;
  placeholder?: string;
  options?: readonly SelectOption[];
  className?: string;
}

function InputRenderer({
  type,
  value,
  onChange,
  error,
  placeholder,
  options,
  className,
}: InputRendererProps) {
  if (type === 'checkbox') {
    return (
      <Checkbox
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(Boolean(checked))}
        aria-invalid={error}
        className={className}
      />
    );
  }

  if (type === 'select') {
    const selectedOption = options?.find((opt) => opt.value === value);
    return (
      <Select value={String(value ?? '')} onValueChange={onChange}>
        <SelectTrigger aria-invalid={error} className={cn('w-full', className)}>
          <SelectValue placeholder={selectedOption?.label ?? 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {options
            ?.filter((opt) => !opt.disabled)
            .map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    );
  }

  const displayValue = Number.isNaN(value as number) ? '' : String(value ?? '');

  return (
    <Input
      type={type}
      value={displayValue}
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        onChange(type === 'number' ? Number(e.target.value) : e.target.value)
      }
      placeholder={placeholder}
      aria-invalid={error}
      className={className}
    />
  );
}

export default InputRenderer;
