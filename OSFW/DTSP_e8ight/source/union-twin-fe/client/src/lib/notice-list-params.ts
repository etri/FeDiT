import {
  NOTICE_PAGE_SIZE_VALUES,
  NOTICE_SORT_BY_VALUES,
  NOTICE_STATUS_VALUES,
  type NoticeListParams,
} from '@/types/noticeboard';

const SORT_ORDER_VALUES = ['ASC', 'DESC'] as const;

export const NOTICE_LIST_DEFAULTS = {
  page: 1,
  size: 50,
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
} satisfies Required<NoticeListParams>;

function parseEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function toSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      for (const entry of value) searchParams.append(key, entry);
    } else if (value !== undefined) {
      searchParams.set(key, value);
    }
  }
  return searchParams;
}

export function parseNoticeListParams(
  searchParams: URLSearchParams,
): Required<NoticeListParams> {
  const page = Number(searchParams.get('page'));
  const size = Number(searchParams.get('size'));

  return {
    page:
      Number.isFinite(page) && page >= 1
        ? Math.floor(page)
        : NOTICE_LIST_DEFAULTS.page,
    size: NOTICE_PAGE_SIZE_VALUES.includes(size)
      ? size
      : NOTICE_LIST_DEFAULTS.size,
    status: parseEnum(
      searchParams.get('status'),
      NOTICE_STATUS_VALUES,
      NOTICE_LIST_DEFAULTS.status,
    ),
    sortBy: parseEnum(
      searchParams.get('sortBy'),
      NOTICE_SORT_BY_VALUES,
      NOTICE_LIST_DEFAULTS.sortBy,
    ),
    sortOrder: parseEnum(
      searchParams.get('sortOrder'),
      SORT_ORDER_VALUES,
      NOTICE_LIST_DEFAULTS.sortOrder,
    ),
  };
}
