import type { PluginConfig } from './PluginConfig.ts';

export interface FormatterConfig extends PluginConfig {
  cache?: boolean; // Indicates whether the formatter should cache its formatting
}
