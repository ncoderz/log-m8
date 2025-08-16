/**
 * Contextual metadata automatically included with all log events from a logger.
 *
 * LogContext provides a way to associate persistent metadata with logger instances
 * that gets automatically included with every log event. This is useful for
 * tracking request IDs, user sessions, service names, or any other contextual
 * information that should be consistent across related log entries.
 *
 * Context is set via logger.setContext() and can contain both predefined
 * properties and arbitrary key-value pairs. Formatters can access context
 * properties using dot-path notation (e.g., {context.requestId}).
 *
 * @example
 * ```typescript
 * const logger = Logging.getLogger('api.auth');
 *
 * // Set context that applies to all subsequent log events
 * logger.setContext({
 *   requestId: 'req-123',
 *   userId: 'user-456',
 *   sessionId: 'sess-789',
 *   service: 'authentication'
 * });
 *
 * // All logs from this logger now include the context
 * logger.info('User authentication started');
 * logger.debug('Validating credentials');
 * logger.info('Authentication successful');
 * ```
 */
export interface LogContext {
  /**
   * Arbitrary context properties using string keys.
   * Supports any serializable values for maximum flexibility.
   */
  [key: string]: unknown;

  /**
   * User identifier for associating log events with specific users.
   * Commonly used for security auditing and user behavior analysis.
   */
  userId?: string;

  /**
   * Request identifier for tracing the complete lifecycle of a request.
   * Essential for distributed tracing and debugging request flows.
   */
  requestId?: string;

  /**
   * Correlation identifier for linking related events across service boundaries.
   * Used in microservice architectures to track operations across multiple services.
   */
  correlationId?: string;
}
