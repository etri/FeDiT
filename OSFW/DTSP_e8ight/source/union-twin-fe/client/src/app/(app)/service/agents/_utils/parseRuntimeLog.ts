export const LOG_LEVELS = [
  'TRACE',
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR',
  'FATAL',
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export interface RuntimeLogEntry {
  id: number;
  time: string | null;
  level: LogLevel | null;
  logger: string;
  message: string;
  continuation: string[];
}

const LOG4J_PATTERN =
  /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),(\d{3})\s+(\w+)\s+\[[^\]]*\]\s+\(([^)]*)\)\s+-\s?(.*)$/;
const LOGBACK_PATTERN =
  /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+(\w+)\s+(\S+)\s+-\s?(.*)$/;

const LEVEL_RANK: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

function toLevel(raw: string): LogLevel | null {
  const upper = raw.toUpperCase();
  return LOG_LEVELS.find((level) => level === upper) ?? null;
}

function parseHeader(
  line: string,
): Omit<RuntimeLogEntry, 'id' | 'continuation'> | null {
  const log4j = LOG4J_PATTERN.exec(line);
  if (log4j) {
    const [, time, millis, level, logger, message] = log4j;
    return {
      time: `${time}.${millis}`,
      level: toLevel(level),
      logger,
      message,
    };
  }
  const logback = LOGBACK_PATTERN.exec(line);
  if (logback) {
    const [, time, level, logger, message] = logback;
    return { time, level: toLevel(level), logger, message };
  }
  return null;
}

export function parseRuntimeLog(log: string): RuntimeLogEntry[] {
  const entries: RuntimeLogEntry[] = [];
  log.split('\n').forEach((line) => {
    if (line.trim() === '') return;
    const header = parseHeader(line);
    const previous = entries.at(-1);
    if (!header && previous) {
      previous.continuation.push(line);
      return;
    }
    entries.push({
      id: entries.length,
      continuation: [],
      ...(header ?? { time: null, level: null, logger: '', message: line }),
    });
  });
  return entries;
}

export function isLevelAtLeast(level: LogLevel | null, minimum: LogLevel) {
  return level !== null && LEVEL_RANK[level] >= LEVEL_RANK[minimum];
}
