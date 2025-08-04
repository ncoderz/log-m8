import type { Plugin } from './Plugin.ts';
import type { PluginConfig } from './PluginConfig.ts';
import type { PluginKindType } from './PluginKind.ts';

export interface PluginFactory<C extends PluginConfig = PluginConfig, P extends Plugin = Plugin> {
  readonly name: string;
  readonly version: string;
  readonly kind: PluginKindType;

  create(config: C): P;
}
