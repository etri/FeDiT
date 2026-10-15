import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export function convertFullDateTimeFromString(dateString: string) {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss.SSS');
}

export function convertDateTimeLocalFormat(date: Date) {
  return dayjs(date).format('YYYY-MM-DDTHH:mm');
}

export function subtractMonth(date: Date, months: number) {
  return dayjs(date).subtract(months, 'month').toDate();
}

export function formatKstDateTime(naiveKstDateString: string) {
  return dayjs
    .tz(naiveKstDateString, 'Asia/Seoul')
    .format('YYYY-MM-DD HH:mm:ss');
}
