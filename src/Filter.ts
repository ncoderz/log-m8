import type { FilterConfig } from './FilterConfig.ts';
import type { LogEvent } from './LogEvent.ts';
import type { Plugin } from './Plugin.ts';

/**
 * Represents a log event filter that can be initialized with specific configuration and determines whether a log event should be logged.
 */
export interface Filter extends Plugin {
  /**
   * Runtime flag controlling whether this filter processes events.
   *
   * Can be toggled via LogM8.enableFilter()/disableFilter() for
   * dynamic output control without full reconfiguration.
   */
  enabled: boolean;

  /**
   * Initializes the filter with the specified configuration.
   * @param config - Filter configuration options.
   */
  init(config: FilterConfig): void;

  /**
   * Determines whether the given log event should be logged.
   * @param logEvent - The log event to evaluate.
   * @returns boolean indicating if the event should be logged.
   */
  filter(logEvent: LogEvent): boolean;

  /**
   * Disposes of the filter, cleaning up any resources.
   *
   * Called during parent's dispose() to clean up the filter's resources.
   */
  dispose(): void;
}
