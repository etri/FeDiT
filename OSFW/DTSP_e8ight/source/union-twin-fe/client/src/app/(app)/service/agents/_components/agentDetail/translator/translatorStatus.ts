const RUNNING_STATUSES = ['RUN', 'HANG'] as const;
const STOPPED_STATUSES = ['STOP', 'DIE', 'CREATED'] as const;

export const isTranslatorRunning = (status: string) =>
  RUNNING_STATUSES.includes(status as (typeof RUNNING_STATUSES)[number]);

export const isTranslatorStopped = (status: string) =>
  STOPPED_STATUSES.includes(status as (typeof STOPPED_STATUSES)[number]);
