import type { FormatterConfig } from './FormatterConfig.ts';
import type { LogEvent } from './LogEvent.ts';
import type { Plugin } from './Plugin.ts';

export interface Formatter extends Plugin {
  init(config: FormatterConfig): void;

  format(logEvent: LogEvent): unknown[];
}
