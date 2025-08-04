import type { AppenderConfig } from './AppenderConfig.ts';
import type { LogLevelType } from './LogLevel.ts';

/**
 * Configuration options for the logging system.
 */
export interface LoggingConfig {
  /**
   * Default log level applied to all loggers.
   */
  level?: LogLevelType;

  /**
   * Named logger specific levels mapping.
   * If set, overrides the default level for specific loggers.
   */
  loggers?: {
    [key: string]: LogLevelType | undefined;
  };

  /**
   * Appender configurations for output destinations.
   */
  appenders?: AppenderConfig[];
}
