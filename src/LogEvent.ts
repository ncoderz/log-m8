import type { LogContext, LogLevelType } from './index.ts';

export interface LogEvent {
  readonly logger: string;
  readonly level: LogLevelType;
  readonly message: string | unknown;
  readonly data: unknown[];
  readonly context: LogContext;
  readonly timestamp: Date;
}
