import type { LogContext } from './LogContext.ts';
import type { LogLevelType } from './LogLevel.ts';

export interface Log {
  fatal(message: string | unknown, ...data: unknown[]): void;
  error(message: string | unknown, ...data: unknown[]): void;
  warn(message: string | unknown, ...data: unknown[]): void;
  info(message: string | unknown, ...data: unknown[]): void;
  debug(message: string | unknown, ...data: unknown[]): void;
  trace(message: string | unknown, ...data: unknown[]): void;
  track(message: string | unknown, ...data: unknown[]): void;

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
