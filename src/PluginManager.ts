import type { Plugin } from './Plugin.ts';
import type { PluginConfig } from './PluginConfig.ts';
import type { PluginFactory } from './PluginFactory.ts';
import type { PluginKindType } from './PluginKind.ts';

/**
 * Manages registration and lifecycle of plugin factories and created plugin instances.
 * Allows registering factories, creating plugins by kind, and disposing resources.
 */
class PluginManager {
  private _pluginFactories: Map<string, PluginFactory> = new Map();
  private _plugins: Plugin[] = [];

  /**
   * Registers a plugin factory.
   * @param pluginFactory - Factory to register for creating plugins.
   * @throws Error if a factory with the same name is already registered.
   */
  registerPluginFactory(pluginFactory: PluginFactory): void {
    if (this._pluginFactories.has(pluginFactory.name)) {
      throw new Error(`LogM8: Plugin with name ${pluginFactory.name} is already registered.`);
    }
    this._pluginFactories.set(pluginFactory.name, pluginFactory);
  }

  /**
   * Creates and registers a plugin instance using the matching factory.
   * @param kind - The kind of plugin to create (appender, filter, formatter).
   * @param nameOrConfig - Plugin name string or configuration object with plugin name.
   * @returns The created plugin instance.
   * @throws Error if no matching factory is found.
   */
  createPlugin(kind: PluginKindType, nameOrConfig: string | PluginConfig): Plugin {
    const name = typeof nameOrConfig === 'string' ? nameOrConfig : nameOrConfig.name;
    const config = typeof nameOrConfig === 'string' ? { name } : nameOrConfig;
    const pluginFactory = this.getPluginFactory(name, kind);
    if (!pluginFactory) {
      throw new Error(`LogM8: Plugin factory kind '${kind}' with name '${name}' not found.`);
    }
    const plugin = pluginFactory.create(config);
    this._plugins.push(plugin);
    return plugin;
  }

  /**
   * Retrieves a registered plugin factory by name and kind.
   * @param name - The factory name.
   * @param kind - The expected plugin kind.
   * @returns The factory if found and matching kind, otherwise undefined.
   */
  getPluginFactory(name: string, kind: PluginKindType): PluginFactory | undefined {
    const pluginFactory = this._pluginFactories.get(name);
    if (!pluginFactory || kind !== pluginFactory.kind) return;
    return pluginFactory;
  }

  /**
   * Disposes all created plugin instances by invoking their dispose methods.
   * Clears the internal plugin list.
   */
  disposePlugins(): void {
    this._plugins.forEach((plugin) => {
      plugin.dispose();
    });
    this._plugins = [];
  }

  /**
   * Clears all registered plugin factories without disposing instances.
   */
  clearFactories(): void {
    this._pluginFactories.clear();
  }
}

export { PluginManager };
