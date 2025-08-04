import type { FilterConfig } from './FilterConfig.ts';
import type { FormatterConfig } from './FormatterConfig.ts';
import type { PluginConfig } from './PluginConfig.ts';

export interface AppenderConfig extends PluginConfig {
  enabled?: boolean;
  priority?: number;
  formatter?: string | FormatterConfig;
  filters?: (string | FilterConfig)[];
}
