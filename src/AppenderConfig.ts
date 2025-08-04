import type { FilterConfig } from './FilterConfig.ts';
import type { FormatterConfig } from './FormatterConfig.ts';
import type { PluginConfig } from './PluginConfig.ts';

/**
 * Defines the configuration options for a log appender plugin.
 */
export interface AppenderConfig extends PluginConfig {
  /**
   * Whether the appender is enabled.
   */
  enabled?: boolean;

  /**
   * Priority determining execution order; lower values run first.
   */
  priority?: number;

  /**
   * The formatter to apply to log events, specified by name or config object.
   */
  formatter?: string | FormatterConfig;

  /**
   * Filters to apply to log events, specified by name or config objects.
   */
  filters?: (string | FilterConfig)[];
}
