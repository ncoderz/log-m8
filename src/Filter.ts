import type { FilterConfig } from './FilterConfig.ts';
import type { LogEvent } from './LogEvent.ts';
import type { Plugin } from './Plugin.ts';

export interface Filter extends Plugin {
  init(config: FilterConfig): void;

  shouldLog(logEvent: LogEvent): boolean;
}
