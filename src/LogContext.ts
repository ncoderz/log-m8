/**
 * Contextual metadata for log events.
 * Contains both predefined and arbitrary key/value pairs to include with log entries.
 */
export interface LogContext {
  /**
   * Arbitrary context key-value pairs.
   */
  [key: string]: unknown;

  /** User identifier associated with the log event. */
  userId?: string;

  /** Request identifier for tracing request lifecycle. */
  requestId?: string;

  /** Correlation identifier for correlating log events across services. */
  correlationId?: string;
}
