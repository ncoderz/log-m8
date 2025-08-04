import type { AppenderConfig } from './AppenderConfig.ts';
import type { LogLevelType } from './LogLevel.ts';

export interface LoggingConfig {
  level?: LogLevelType;
  loggers?: {
    [key: string]: LogLevelType | undefined;
  };
  appenders?: AppenderConfig[];
  asyncBuffering?: {
    enabled: boolean;
    messageCount: number;
    timeout: number;
  };
}
