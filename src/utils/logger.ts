export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export function log(entry: LogEntry): void {
  const payload = entry.context ? [entry.message, entry.context] : [entry.message];

  if (entry.level === 'error') {
    console.error(...payload);
    return;
  }

  if (entry.level === 'warn') {
    console.warn(...payload);
    return;
  }

  if (entry.level === 'debug') {
    console.debug(...payload);
    return;
  }

  console.info(...payload);
}
