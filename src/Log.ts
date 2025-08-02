import type { LogContext } from './LogContext.ts';
import type { LogLevelType } from './LogLevel.ts';

export interface Log {
  fatal(...data: unknown[]): void;
  error(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  info(...data: unknown[]): void;
  debug(...data: unknown[]): void;
  trace(...data: unknown[]): void;
  track(...data: unknown[]): void;

  readonly isFatal: boolean;
  readonly isError: boolean;
  readonly isWarn: boolean;
  readonly isInfo: boolean;
  readonly isDebug: boolean;
  readonly isTrace: boolean;
  readonly isTrack: boolean;

  readonly name: string;
  readonly level: LogLevelType;
  readonly context: LogContext;

  setLevel(level: string): void;
  setContext(context: LogContext): void;

  getLogger(name: string, context: LogContext): Log;
}
