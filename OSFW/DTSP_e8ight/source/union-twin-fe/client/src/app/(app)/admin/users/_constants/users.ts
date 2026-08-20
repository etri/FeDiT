import type { SortOrder } from '@/app/(app)/admin/_types/admin';

export const DEFAULT_USERS_QUERY = {
  page: 1,
  size: 50,
  sortBy: 'role',
  sortOrder: 'ASC' as SortOrder,
};

export const TABLE_HEADERS = [
  { key: 'name', label: '사용자', sortable: true },
  { key: 'organization', label: '소속', sortable: true },
  { key: 'phoneNumber', label: '연락처', sortable: true },
  { key: 'role', label: '역할', sortable: true },
  { key: 'isActive', label: '상태', sortable: true },
  { key: 'createdAt', label: '가입일', sortable: true },
] as const;

export const PAGE_SIZES = [10, 20, 50] as const;

export const ROLE_BADGE_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline'
> = {
  ADMIN: 'default',
  EDITOR: 'secondary',
  VIEWER: 'outline',
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: '관리자',
  EDITOR: '편집자',
  VIEWER: '뷰어',
};
