import type { Plugin } from './Plugin.ts';
import type { PluginConfig } from './PluginConfig.ts';
import type { PluginKindType } from './PluginKind.ts';

/**
 * Factory for creating plugin instances of a specific kind.
 * @template C - Plugin configuration type.
 * @template P - Plugin instance type.
 */
export interface PluginFactory<C extends PluginConfig = PluginConfig, P extends Plugin = Plugin> {
  /** The unique factory name. */
  readonly name: string;

  /** The factory version corresponding to plugin implementations. */
  readonly version: string;

  /** The kind of plugin this factory creates. */
  readonly kind: PluginKindType;

  /**
   * Creates a plugin instance using the provided configuration.
   * @param config - Configuration for the plugin.
   * @returns A new plugin instance.
   */
  create(config: C): P;
}
