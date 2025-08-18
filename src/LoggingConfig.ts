import type { AppenderConfig } from './AppenderConfig.ts';
import type { FilterConfig } from './FilterConfig.ts';
import type { LogLevelType } from './LogLevel.ts';

/**
 * Primary configuration object for initializing the LogM8 logging system.
 *
 * Defines the overall logging behavior including default levels, per-logger
 * overrides, and output destinations. Used as the parameter to LogM8.init()
 * to configure the entire logging pipeline.
 *
 * If no configuration is provided, the system defaults to console output
 * at 'info' level with the default formatter.
 *
 * @example
 * ```typescript
 * const config: LoggingConfig = {
 *   level: 'info',
 *   loggers: {
 *     'app.database': 'debug',      // More verbose for database operations
 *     'app.security': 'warn',       // Less verbose for security components
 *     'app.performance': 'trace'    // Maximum detail for performance monitoring
 *   },
 *   appenders: [
 *     {
 *       name: 'console',
 *       formatter: { name: 'default-formatter', color: true }
 *     },
 *     {
 *       name: 'file',
 *       filename: 'app.log',
 *       formatter: { name: 'json-formatter', pretty: true }
 *     }
 *   ]
 * };
 *
 * Logging.init(config);
 * ```
 */
export interface LoggingConfig {
  /**
   * Default log level applied to all loggers unless overridden.
   *
   * Determines the minimum severity level that will be processed.
   * Loggers will emit events at this level and all higher severity levels.
   * Defaults to 'info' if not specified.
   */
  level?: string | LogLevelType;

  /**
   * Per-logger level overrides by hierarchical name.
   *
   * Allows fine-grained control over logging verbosity for different
   * parts of the application. Logger names use dot-separated hierarchical
   * notation where child loggers inherit from parent configurations.
   *
   * @example
   * ```typescript
   * loggers: {
   *   'app': 'info',              // Base level for 'app' namespace
   *   'app.database': 'debug',    // More verbose for database operations
   *   'app.database.queries': 'trace' // Maximum detail for query logging
   * }
   * ```
   */
  loggers?: {
    [key: string]: LogLevelType | undefined;
  };

  /**
   * Output destination configurations.
   *
   * Defines where and how log events are written. Each appender can have
   * its own formatter, filters, and specific configuration options.
   * If not specified, defaults to a single console appender.
   *
   * Appenders are executed in priority order (highest first) for
   * deterministic output behavior.
   */
  appenders?: (string | AppenderConfig)[];

  /**
   * Global filters applied before any appender-specific processing.
   *
   * Each entry may be a string (filter factory name) or a full FilterConfig
   * object. Global filters run first and can drop events entirely before they
   * reach appenders. Appenders may also define their own filters via
   * AppenderConfig.filters.
   */
  filters?: (string | FilterConfig)[];
}
