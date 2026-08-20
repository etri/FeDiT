import { useMemo, useState } from 'react';

import { stripMarkdown } from '@/app/(app)/noticeboard/_lib/notice-utils';

import type { Notice } from '@/types/noticeboard';

export function useNoticeSearch(notices: Notice[]) {
  const [keyword, setKeyword] = useState('');

  const searchableNotices = useMemo(
    () =>
      notices.map((n) => ({
        notice: n,
        haystack: `${n.title} ${stripMarkdown(n.content)}`.toLowerCase(),
      })),
    [notices],
  );

  const results = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return notices;
    return searchableNotices
      .filter((entry) => entry.haystack.includes(trimmed))
      .map((entry) => entry.notice);
  }, [keyword, notices, searchableNotices]);

  return { keyword, setKeyword, results };
}
