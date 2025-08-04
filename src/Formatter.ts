import type { FormatterConfig } from './FormatterConfig.ts';
import type { LogEvent } from './LogEvent.ts';
import type { Plugin } from './Plugin.ts';

/**
 * Represents a log event formatter that initializes with configuration and converts log events into output tokens.
 */
export interface Formatter extends Plugin {
  /**
   * Initializes the formatter with the specified configuration.
   * @param config - Formatter configuration options.
   */
  init(config: FormatterConfig): void;

  /**
   * Formats the given log event into an array of output tokens.
   * @param logEvent - The log event to format.
   * @returns An array of formatted output elements.
   */
  format(logEvent: LogEvent): unknown[];
}
