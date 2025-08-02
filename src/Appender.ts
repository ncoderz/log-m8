import type { AppenderConfig } from './AppenderConfig.ts';
import type { Filter } from './Filter.ts';
import type { Formatter } from './Formatter.ts';
import type { LogEvent } from './LogEvent.ts';
import type { LogLevelType } from './LogLevel.ts';
import type { Plugin } from './Plugin.ts';

export interface Appender extends Plugin {
  init(config: AppenderConfig, formatter?: Formatter, filters?: Filter[]): void;

  getPriority(): number | undefined;
  getSupportedLevels(): LogLevelType[];

  write(logEvent: LogEvent): void;
  flush(): void;
}
