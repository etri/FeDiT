import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import {
  getAdminNotices,
  getNotice,
  getNotices,
} from '@/apis/notices/noticesApi';

import type { NoticeListParams } from '@/types/noticeboard';

export const noticeKeys = {
  all: ['notices'] as const,
  lists: () => [...noticeKeys.all, 'list'] as const,
  list: (params: NoticeListParams) => [...noticeKeys.lists(), params] as const,
  detail: (id: string) => [...noticeKeys.all, 'detail', id] as const,
  admin: ['notices', 'admin'] as const,
  adminLists: () => [...noticeKeys.admin, 'list'] as const,
  adminList: (params: NoticeListParams) =>
    [...noticeKeys.adminLists(), params] as const,
};

export const noticeQueries = {
  list: (params: NoticeListParams) =>
    queryOptions({
      queryKey: noticeKeys.list(params),
      queryFn: () => getNotices(params),
      placeholderData: keepPreviousData,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: noticeKeys.detail(id),
      queryFn: () => getNotice(id),
    }),

  adminList: (params: NoticeListParams) =>
    queryOptions({
      queryKey: noticeKeys.adminList(params),
      queryFn: () => getAdminNotices(params),
    }),
};
