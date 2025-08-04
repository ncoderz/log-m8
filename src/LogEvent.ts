import type { LogContext, LogLevelType } from './index.ts';

/**
 * Represents an individual log event with message, level, context, and timestamp.
 */
export interface LogEvent {
  /** Name of the logger instance that generated this event. */
  readonly logger: string;

  /** Severity level of the log event. */
  readonly level: LogLevelType;

  /** The log message or object to record. */
  readonly message: string | unknown;

  /** Additional data provided alongside the log message. */
  readonly data: unknown[];

  /** Contextual metadata associated with the event. */
  readonly context: LogContext;

  /** Timestamp indicating when the event was created. */
  readonly timestamp: Date;
}
