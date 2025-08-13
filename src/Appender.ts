import type { AppenderConfig } from './AppenderConfig.ts';
import type { Filter } from './Filter.ts';
import type { Formatter } from './Formatter.ts';
import type { LogEvent } from './LogEvent.ts';
import type { LogLevelType } from './LogLevel.ts';
import type { Plugin } from './Plugin.ts';

/**
 * Plugin interface for log event output destinations.
 *
 * Appenders receive formatted log events and write them to specific outputs
 * like console, files, network endpoints, or databases. They can be dynamically
 * enabled/disabled and support priority-based execution ordering.
 *
 * Each appender declares which log levels it supports and can optionally
 * use formatters to transform events and filters to determine eligibility.
 *
 * @example
 * ```typescript
 * class DatabaseAppender implements Appender {
 *   name = 'database';
 *   supportedLevels = new Set(['error', 'fatal']);
 *   enabled = true;
 *   priority = 10;
 *
 *   init(config, formatter, filters) {
 *     this.db = new Database(config.connectionString);
 *   }
 *
 *   write(event) {
 *     this.db.insert('logs', this.formatter.format(event));
 *   }
 * }
 * ```
 */
export interface Appender extends Plugin {
  /**
   * Set of log levels this appender can process.
   *
   * Events with levels not in this set are automatically skipped.
   * Use this to restrict appenders to specific severity ranges.
   */
  readonly supportedLevels: Set<LogLevelType>;

  /**
   * Runtime flag controlling whether this appender processes events.
   *
   * Can be toggled via LogM8.enableAppender()/disableAppender() for
   * dynamic output control without full reconfiguration.
   */
  enabled: boolean;

  /**
   * Execution priority for deterministic appender ordering.
   *
   * Higher values execute first. Undefined/null treated as 0.
   * Useful for ensuring critical appenders (like error alerting)
   * process events before optional ones (like debug files).
   */
  priority?: number;

  /**
   * Initializes the appender with configuration and optional processing components.
   *
   * Called once during LogM8.init() to set up the appender with its specific
   * configuration, formatter for event transformation, and filters for event
   * eligibility determination.
   *
   * @param config - Appender-specific configuration options
   * @param formatter - Optional formatter to transform log events before output
   * @param filters - Optional filters to determine which events to process
   */
  init(config: AppenderConfig, formatter?: Formatter, filters?: Filter[]): void;

  /**
   * Processes a single log event for output.
   *
   * Called for each log event that passes level and filter checks.
   * Implementations should handle formatting (if no formatter provided)
   * and write to their specific output destination.
   *
   * @param logEvent - The log event to be processed and output
   */
  write(logEvent: LogEvent): void;

  /**
   * Forces immediate output of any buffered log events.
   *
   * Called during appender shutdown or when explicitly requested via
   * LogM8.flushAppender(). Implementations should ensure data persistence.
   */
  flush(): void;
}
