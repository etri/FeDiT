interface DateParts {
  hour: string;
  minute: string;
  second: string;
  dayPeriod: string;
}

export function formatDateParts(date: Date): DateParts {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat('en-us', options);
  const parts = formatter.formatToParts(date);

  const dateParts: Record<string, string> = {};
  parts.forEach((part) => {
    dateParts[part.type] = part.value;
  });

  return {
    hour: dateParts.hour,
    minute: dateParts.minute,
    second: dateParts.second,
    dayPeriod: dateParts.dayPeriod,
  };
}
