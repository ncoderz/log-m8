import type { Plugin } from './Plugin.ts';
import type { PluginConfig } from './PluginConfig.ts';
import type { PluginFactory } from './PluginFactory.ts';
import type { PluginKindType } from './PluginKind.ts';

class PluginManager {
  private _pluginFactories: Map<string, PluginFactory> = new Map();
  private _plugins: Plugin[] = [];

  registerPluginFactory(pluginFactory: PluginFactory): void {
    if (this._pluginFactories.has(pluginFactory.name)) {
      throw new Error(`LogM8: Plugin with name ${pluginFactory.name} is already registered.`);
    }
    this._pluginFactories.set(pluginFactory.name, pluginFactory);
  }

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

  getPluginFactory(name: string, kind: PluginKindType): PluginFactory | undefined {
    const pluginFactory = this._pluginFactories.get(name);
    if (!pluginFactory || kind !== pluginFactory.kind) return;
    return pluginFactory;
  }

  disposePlugins(): void {
    this._plugins.forEach((plugin) => {
      plugin.dispose();
    });
    this._plugins = [];
  }

  clearFactories(): void {
    this._pluginFactories.clear();
  }
}

export { PluginManager };
