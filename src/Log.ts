import type { LogContext } from './LogContext.ts';
import type { LogLevelType } from './LogLevel.ts';

/**
 * Interface for a hierarchical logger instance providing level-based logging methods.
 *
 * Logger instances are created via LogM8.getLogger() and provide methods for emitting
 * log events at different severity levels. Each logger maintains its own context and
 * can create child loggers using dot-separated naming conventions.
 *
 * @example
 * ```typescript
 * const logger = Logging.getLogger('app.database');
 * logger.setLevel('debug');
 * logger.info('Connection established', { host: 'localhost' });
 *
 * // Create child logger
 * const queryLogger = logger.getLogger('queries');
 * queryLogger.debug('SELECT * FROM users'); // Name becomes 'app.database.queries'
 *
 * // Check if logging is enabled before expensive operations
 * if (logger.isEnabled && logger.isDebug) {
 *   logger.debug('Expensive debug data', computeExpensiveDebugInfo());
 * }
 * ```
 */
export interface Log {
  /**
   * Logs a message at fatal severity level.
   *
   * Fatal events indicate critical system failures that typically require
   * immediate intervention and may result in application termination.
   *
   * @param message - Primary message or serializable object to log
   * @param data - Additional context data to include with the log event
   */
  fatal(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a message at error severity level.
   *
   * Error events indicate failures that prevent normal operation but
   * don't necessarily require application termination.
   *
   * @param message - Primary message or serializable object to log
   * @param data - Additional context data to include with the log event
   */
  error(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a message at warning severity level.
   *
   * Warning events indicate potentially problematic situations that
   * don't prevent operation but may require attention.
   *
   * @param message - Primary message or serializable object to log
   * @param data - Additional context data to include with the log event
   */
  warn(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a message at info severity level.
   *
   * Info events provide general informational messages about normal
   * application operation and significant business events.
   *
   * @param message - Primary message or serializable object to log
   * @param data - Additional context data to include with the log event
   */
  info(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a message at debug severity level.
   *
   * Debug events provide detailed diagnostic information useful during
   * development and troubleshooting.
   *
   * @param message - Primary message or serializable object to log
   * @param data - Additional context data to include with the log event
   */
  debug(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a message at trace severity level.
   *
   * Trace events provide the most detailed execution information,
   * typically used for fine-grained debugging and performance analysis.
   *
   * @param message - Primary message or serializable object to log
   * @param data - Additional context data to include with the log event
   */
  trace(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a message at track severity level.
   *
   * Track events are specifically designed for analytics and user behavior
   * tracking, separate from operational logging concerns.
   *
   * @param message - Primary message or serializable object to log
   * @param data - Additional context data to include with the log event
   */
  track(message: string | unknown, ...data: unknown[]): void;

  /**
   * True when logger's current level enables fatal severity logging.
   * When true, fatal() calls will emit log events.
   */
  readonly isFatal: boolean;

  /**
   * True when logger's current level enables error severity logging.
   * When true, error() calls will emit log events.
   */
  readonly isError: boolean;

  /**
   * True when logger's current level enables warn severity logging.
   * When true, warn() calls will emit log events.
   */
  readonly isWarn: boolean;

  /**
   * True when logger's current level enables info severity logging.
   * When true, info() calls will emit log events.
   */
  readonly isInfo: boolean;

  /**
   * True when logger's current level enables debug severity logging.
   * When true, debug() calls will emit log events.
   */
  readonly isDebug: boolean;

  /**
   * True when logger's current level enables trace severity logging.
   * When true, trace() calls will emit log events.
   */
  readonly isTrace: boolean;

  /**
   * True when logger's current level enables track severity logging.
   * When true, track() calls will emit log events.
   */
  readonly isTrack: boolean;

  /**
   * True when logging is enabled for this logger.
   * False only when the logger level is set to 'off', disabling all log output.
   */
  readonly isEnabled: boolean;

  /** The dot-separated hierarchical name of this logger instance. */
  readonly name: string;

  /** The current logging level determining which events are emitted. */
  readonly level: LogLevelType;

  /** Contextual data automatically included with all log events from this logger. */
  readonly context: LogContext;

  /**
   * Updates the logger's severity level threshold.
   *
   * Events at or below this level will be emitted based on the level hierarchy:
   * off < fatal < error < warn < info < debug < track < trace
   *
   * @param level - New logging level name (e.g., 'info', 'debug', 'off')
   */
  setLevel(level: LogLevelType): void;

  /**
   * Replaces the logger's contextual data.
   *
   * Context is automatically included with all log events emitted by this logger,
   * providing consistent metadata across related log entries.
   *
   * @param context - New context object to associate with this logger
   */
  setContext(context: LogContext): void;

  /**
   * Creates or retrieves a child logger with hierarchical naming.
   *
   * Child loggers inherit configuration but can have independent levels and context.
   * The child's name becomes 'parent.child' using dot notation.
   *
   * @param name - Name segment for the child logger
   * @returns Child logger instance with name 'parent.child'
   *
   * @example
   * ```typescript
   * const parent = Logging.getLogger('app');
   * const child = parent.getLogger('database'); // Name: 'app.database'
   * const grandchild = child.getLogger('queries'); // Name: 'app.database.queries'
   * ```
   */
  getLogger(name: string): Log;
}
