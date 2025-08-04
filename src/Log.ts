import type { LogContext } from './LogContext.ts';
import type { LogLevelType } from './LogLevel.ts';

/**
 * Represents a logger with methods for various log levels and properties for configuration and status.
 */
export interface Log {
  /**
   * Logs a fatal level message.
   * @param message - The message or object to log.
   * @param data - Additional data to include.
   */
  fatal(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs an error level message.
   * @param message - The message or object to log.
   * @param data - Additional data to include.
   */
  error(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a warning level message.
   * @param message - The message or object to log.
   * @param data - Additional data to include.
   */
  warn(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs an info level message.
   * @param message - The message or object to log.
   * @param data - Additional data to include.
   */
  info(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a debug level message.
   * @param message - The message or object to log.
   * @param data - Additional data to include.
   */
  debug(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a trace level message.
   * @param message - The message or object to log.
   * @param data - Additional data to include.
   */
  trace(message: string | unknown, ...data: unknown[]): void;

  /**
   * Logs a track level message.
   * @param message - The message or object to log.
   * @param data - Additional data to include.
   */
  track(message: string | unknown, ...data: unknown[]): void;

  /** Indicates if fatal level logging is enabled. */
  readonly isFatal: boolean;
  /** Indicates if error level logging is enabled. */
  readonly isError: boolean;
  /** Indicates if warning level logging is enabled. */
  readonly isWarn: boolean;
  /** Indicates if info level logging is enabled. */
  readonly isInfo: boolean;
  /** Indicates if debug level logging is enabled. */
  readonly isDebug: boolean;
  /** Indicates if trace level logging is enabled. */
  readonly isTrace: boolean;
  /** Indicates if track level logging is enabled. */
  readonly isTrack: boolean;

  /** The name of the logger instance. */
  readonly name: string;
  /** The current logging level. */
  readonly level: LogLevelType;
  /** The context associated with this logger. */
  readonly context: LogContext;

  /**
   * Sets the logging level by name.
   * @param level - The new logging level (e.g., 'info', 'debug').
   */
  setLevel(level: string): void;

  /**
   * Sets the logger's context.
   * @param context - The context to associate with this logger.
   */
  setContext(context: LogContext): void;

  /**
   * Retrieves or creates a child logger with the given name.
   * @param name - The name of the child logger.
   * @returns The child logger instance.
   */
  getLogger(name: string): Log;
}
