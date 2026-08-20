import { QueryFailedError } from 'typeorm';

import { PG_UNIQUE_VIOLATION } from '../constants';

export function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err as QueryFailedError & { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}
