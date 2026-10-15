import { useId, useState } from 'react';

import { Button } from '@e8ight/ui/components/ui/button';
import { Calendar } from '@e8ight/ui/components/ui/calendar';
import { Field, FieldGroup, FieldLabel } from '@e8ight/ui/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@e8ight/ui/components/ui/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@e8ight/ui/components/ui/popover';
import { cn } from 'cn';
import { CalendarIcon, Clock2Icon, XIcon } from 'lucide-react';

import { convertDateTimeLocalFormat } from '@/lib/date';

interface EntityDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function parseDateTimeValue(value: string) {
  if (!value) {
    return undefined;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate;
}

function formatDisplayValue(value: string) {
  const parsedDate = parseDateTimeValue(value);

  if (!parsedDate) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsedDate);
}

function getTimeValue(value: string) {
  const parsedDate = parseDateTimeValue(value);

  if (!parsedDate) {
    return '00:00';
  }

  return `${parsedDate.getHours().toString().padStart(2, '0')}:${parsedDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

function buildDateTimeValue(date: Date, timeValue: string) {
  const [hours = '00', minutes = '00'] = timeValue.split(':');
  const nextDate = new Date(date);

  nextDate.setHours(Number(hours), Number(minutes), 0, 0);

  return convertDateTimeLocalFormat(nextDate);
}

function EntityDateTimePicker({
  value,
  onChange,
  placeholder = 'Select date and time',
  disabled,
  className,
}: EntityDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const timeInputId = useId();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const selectedDate = parseDateTimeValue(value);
  const timeValue = getTimeValue(value);
  const displayValue = formatDisplayValue(value);

  const updateFromDate = (date: Date | undefined) => {
    if (!date) {
      onChange('');
      return;
    }

    onChange(buildDateTimeValue(date, timeValue));
  };

  const updateFromTime = (nextTimeValue: string) => {
    const baseDate = selectedDate ?? new Date();

    onChange(buildDateTimeValue(baseDate, nextTimeValue));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full min-w-0 justify-between px-3 font-normal',
            !displayValue && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate text-left">
            {displayValue || placeholder}
          </span>
          <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-[calc(100vw-2rem)] p-3"
      >
        <div className="flex flex-col gap-3">
          <Calendar
            className="rounded-lg border p-0"
            mode="single"
            selected={selectedDate}
            onSelect={updateFromDate}
            captionLayout="dropdown"
            timeZone={timeZone}
          />
          <div className="border-border border-t pt-3">
            <FieldGroup className="gap-2">
              <Field className="gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel
                    htmlFor={timeInputId}
                    className="text-foreground p-0 text-xs font-medium"
                  >
                    Time
                  </FieldLabel>
                  {value ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto px-1 py-0.5 text-xs"
                      onClick={() => onChange('')}
                    >
                      <XIcon className="size-3.5" />
                      Clear
                    </Button>
                  ) : null}
                </div>
                <InputGroup className="max-w-40">
                  <InputGroupInput
                    id={timeInputId}
                    type="time"
                    step={60}
                    value={timeValue}
                    onChange={(event) => updateFromTime(event.target.value)}
                    className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                  <InputGroupAddon align="inline-end">
                    <Clock2Icon className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default EntityDateTimePicker;
