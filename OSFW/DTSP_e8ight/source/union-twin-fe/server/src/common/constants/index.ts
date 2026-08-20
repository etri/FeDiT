export const Role = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export const DEFAULT_BOARD_TITLE = '공지사항';

export const PG_UNIQUE_VIOLATION = '23505';

export const BCRYPT_SALT_ROUNDS = 12;

export const DEFAULT_PAGE = 1;
export const MAX_PAGE = 10_000;
export const DEFAULT_SIZE = 10;
export const MAX_SIZE = 100;

export const MAX_NOTICE_CONTENT_LENGTH = 50_000;
