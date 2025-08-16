/**
 * Configuration options for initializing a plugin.
 */
export interface PluginConfig {
  /**
   * The plugin's unique name.
   */
  name: string;

  /**
   * Additional plugin-specific settings.
   */
  [key: string]: unknown;
}
