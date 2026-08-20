const READING_WORDS_PER_MINUTE = 200;

export function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max).trimEnd()}…`;
}

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat('ko', {
  numeric: 'auto',
});

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

export function formatRelativeDate(iso: string): string {
  const target = new Date(iso).getTime();
  let duration = (target - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE_FORMATTER.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return RELATIVE_FORMATTER.format(Math.round(duration), 'year');
}

const ABSOLUTE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatAbsoluteDate(iso: string): string {
  return ABSOLUTE_FORMATTER.format(new Date(iso));
}

export function estimateReadingMinutes(input: string): number {
  const plain = stripMarkdown(input);
  if (!plain) return 0;
  const words = plain.split(/\s+/).filter(Boolean).length;
  const koreanChars = (plain.match(/[가-힯]/g) ?? []).length;
  const adjustedWords = words + Math.floor(koreanChars / 2);
  return Math.max(1, Math.round(adjustedWords / READING_WORDS_PER_MINUTE));
}
