import type { PluginConfig } from './PluginConfig.ts';

/**
 * Defines configuration options for a filter plugin.
 * @extends PluginConfig
 */
export interface FilterConfig extends PluginConfig {
  /**
   * Whether the filter is enabled.
   */
  enabled?: boolean;
}
