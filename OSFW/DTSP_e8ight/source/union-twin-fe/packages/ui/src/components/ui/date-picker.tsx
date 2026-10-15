'use client';

import * as React from 'react';
import type { Locale } from 'react-day-picker';

import { CalendarIcon } from 'lucide-react';

import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../utils/cn';

function DatePicker({
  selected,
  onSelect,
  placeholder,
  formatValue,
  locale,
  calendarProps,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'onSelect' | 'children'> & {
  selected?: Date;
  onSelect?: (date?: Date) => void;
  placeholder?: string;
  formatValue?: (date: Date) => string;
  locale?: Partial<Locale>;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    'mode' | 'selected' | 'onSelect'
  >;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-slot="date-picker-trigger"
          className={cn(
            'justify-start font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
          {...props}
        >
          <CalendarIcon data-icon="inline-start" />
          {selected
            ? (formatValue?.(selected) ??
              selected.toLocaleDateString(locale?.code))
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-slot="date-picker-content"
        align="start"
        className="w-auto p-0"
      >
        <Calendar
          locale={locale}
          {...calendarProps}
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onSelect?.(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
export { enUS, ko } from 'react-day-picker/locale';
