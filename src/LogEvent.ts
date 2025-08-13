import type { LogContext, LogLevelType } from './index.ts';

/**
 * Structured representation of a single log entry containing all event data.
 *
 * LogEvent objects are created automatically when logger methods are called
 * and contain the complete context needed for formatting and output by appenders.
 * They are immutable once created and flow through the logging pipeline.
 *
 * @example
 * ```typescript
 * // Created automatically when calling:
 * logger.info('User login', { userId: 123, ip: '192.168.1.1' });
 *
 * // Results in LogEvent:
 * {
 *   logger: 'app.auth',
 *   level: 'info',
 *   message: 'User login',
 *   data: [{ userId: 123, ip: '192.168.1.1' }],
 *   context: { sessionId: 'sess-456' },
 *   timestamp: new Date('2025-08-04T14:23:45.123Z')
 * }
 * ```
 */
export interface LogEvent {
  /**
   * Hierarchical name of the logger that generated this event.
   * Used for filtering and routing by appenders and formatters.
   */
  readonly logger: string;

  /**
   * Severity level determining event importance and routing.
   * Must match one of the LogLevel enum values.
   */
  readonly level: LogLevelType;

  /**
   * Primary log content - can be string, object, or any serializable value.
   * Formatters determine how this is rendered in output.
   */
  readonly message: string | unknown;

  /**
   * Additional arguments passed to the logging method.
   * Typically contains context objects, error details, or supplementary data.
   */
  readonly data: unknown[];

  /**
   * Logger's contextual metadata at the time of event creation.
   * Automatically included from logger.setContext() calls.
   */
  readonly context: LogContext;

  /**
   * Event creation timestamp for chronological ordering and time-based formatting.
   * Set automatically when the log method is called.
   */
  readonly timestamp: Date;
}
