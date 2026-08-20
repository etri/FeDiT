import dayjs from 'dayjs';

export function convertFullDateTimeFromString(dateString: string) {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss.SSS');
}

export function convertDateTimeLocalFormat(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const isoString = new Date(date.getTime() - tzOffset).toISOString();
  const secondSeparatorIndex = isoString.lastIndexOf(':');
  return isoString.slice(0, secondSeparatorIndex);
}

export function subtractMonth(date: Date, months: number) {
  return dayjs(date).subtract(months, 'month').toDate();
}
