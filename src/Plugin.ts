import type { PluginConfig } from './PluginConfig.ts';
import type { PluginKindType } from './PluginKind.ts';

/**
 * Represents a plugin with identifying metadata and lifecycle methods.
 */
export interface Plugin {
  /** The unique plugin name. */
  readonly name: string;

  /** The plugin version in semver format. */
  readonly version: string;

  /** The kind of plugin, categorizing its behavior. */
  readonly kind: PluginKindType;

  /**
   * Initializes the plugin with the given configuration.
   * @param config - Plugin configuration options.
   */
  init(config: PluginConfig): void;

  /**
   * Disposes the plugin, releasing any used resources.
   */
  dispose(): void;
}
