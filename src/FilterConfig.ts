import type { PluginConfig } from './PluginConfig.ts';

export interface FilterConfig extends PluginConfig {
  type: string; // e.g., 'level', 'context'
}
