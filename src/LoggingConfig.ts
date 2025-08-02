import type { AppenderConfig } from './AppenderConfig.ts';
import type { FilterConfig } from './FilterConfig.ts';
import type { FormatterConfig } from './FormatterConfig.ts';
import type { LogLevelType } from './LogLevel.ts';

export interface LoggingConfig {
  level?: LogLevelType;
  loggers?: {
    [key: string]: LogLevelType | undefined;
  };
  appenders?: AppenderConfig[];
  filters?: FilterConfig[];
  formatters?: FormatterConfig[];
  asyncBuffering?: {
    enabled: boolean;
    messageCount: number;
    timeout: number;
  };
}
