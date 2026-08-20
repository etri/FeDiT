export type NoticeStatus = 'published' | 'unpublished' | 'all';

export interface NoticeAuthor {
  id: string;
  name: string;
  email: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: NoticeAuthor;
  authorId: string;
  isPinned: boolean;
  isPublished: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoticePayload {
  title: string;
  content: string;
}

export interface UpdateNoticePayload {
  title?: string;
  content?: string;
}

export type NoticeSortBy = 'title' | 'viewCount' | 'createdAt' | 'isPublished';

export interface NoticeListParams {
  page: number;
  size: number;
  status?: NoticeStatus;
  sortBy?: NoticeSortBy;
  sortOrder?: 'ASC' | 'DESC';
}

export const NOTICE_STATUS_VALUES: NoticeStatus[] = [
  'all',
  'published',
  'unpublished',
];

export const NOTICE_SORT_BY_VALUES: NoticeSortBy[] = [
  'title',
  'viewCount',
  'createdAt',
  'isPublished',
];

export const NOTICE_PAGE_SIZE_VALUES = [10, 20, 50];
