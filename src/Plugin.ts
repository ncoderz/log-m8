import type { PluginConfig } from './PluginConfig.ts';
import type { PluginKind } from './PluginKind.ts';

export interface Plugin {
  readonly name: string;
  readonly version: string;
  readonly kind: PluginKind;

  init(config: PluginConfig): void;
  dispose(): void;
}
