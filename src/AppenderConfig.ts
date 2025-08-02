import type { PluginConfig } from './PluginConfig.ts';

export interface AppenderConfig extends PluginConfig {
  priority?: number; // Optional priority for the appender
  formatter?: string;
  filters?: string[];
}
