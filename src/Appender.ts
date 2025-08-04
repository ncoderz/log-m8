import type { AppenderConfig } from './AppenderConfig.ts';
import type { Filter } from './Filter.ts';
import type { Formatter } from './Formatter.ts';
import type { LogEvent } from './LogEvent.ts';
import type { LogLevelType } from './LogLevel.ts';
import type { Plugin } from './Plugin.ts';

/**
 * Defines a log appender plugin responsible for handling and emitting log events.
 */
export interface Appender extends Plugin {
  /**
   * The set of log levels supported by this appender.
   */
  readonly supportedLevels: Set<LogLevelType>;

  /**
   * Indicates whether the appender is currently enabled.
   */
  enabled: boolean;

  /**
   * Optional priority for determining the execution order of appenders; lower values run first.
   */
  priority?: number;

  /**
   * Initializes the appender with the given configuration, optional formatter, and filters.
   * @param config - Configuration options specific to this appender.
   * @param formatter - Optional formatter for rendering log events.
   * @param filters - Optional array of filters to apply to log events.
   */
  init(config: AppenderConfig, formatter?: Formatter, filters?: Filter[]): void;

  /**
   * Writes a single log event to the appender's output destination.
   * @param logEvent - The log event to be written.
   */
  write(logEvent: LogEvent): void;

  /**
   * Flushes any buffered log events to the output destination.
   */
  flush(): void;
}
