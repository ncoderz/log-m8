import type { AppenderConfig } from './AppenderConfig.ts';
import type { Filter } from './Filter.ts';
import type { Formatter } from './Formatter.ts';
import type { LogEvent } from './LogEvent.ts';
import type { LogLevelType } from './LogLevel.ts';
import type { Plugin } from './Plugin.ts';

export interface Appender extends Plugin {
  readonly supportedLevels: Set<LogLevelType>;
  enabled: boolean;
  priority?: number;

  init(config: AppenderConfig, formatter?: Formatter, filters?: Filter[]): void;

  write(logEvent: LogEvent): void;
  flush(): void;
}
