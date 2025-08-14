import { LogM8 } from './LogM8.ts';

// Type exports for public API
export { type Appender } from './Appender.ts';
export { type AppenderConfig } from './AppenderConfig.ts';
export { type ConsoleAppenderConfig } from './appenders/ConsoleAppender.ts';
export { type FileAppenderConfig } from './appenders/FileAppender.ts';
export { type Filter } from './Filter.ts';
export { type FilterConfig } from './FilterConfig.ts';
export { type DefaultFilterConfig } from './filters/DefaultFilter.ts';
export { type Formatter } from './Formatter.ts';
export { type FormatterConfig } from './FormatterConfig.ts';
export { type DefaultFormatterConfig } from './formatters/DefaultFormatter.ts';
export { type Log } from './Log.ts';
export { type LogContext } from './LogContext.ts';
export { type LoggingConfig } from './LoggingConfig.ts';
export { LogLevel, type LogLevelType } from './LogLevel.ts';
export { LogM8Utils } from './LogM8Utils.ts';
export { type Plugin } from './Plugin.ts';
export { type PluginConfig } from './PluginConfig.ts';
export { type PluginFactory } from './PluginFactory.ts';
export { PluginKind, type PluginKindType } from './PluginKind.ts';

/**
 * Default singleton instance of the LogM8 logging manager.
 *
 * Pre-configured with built-in appenders and formatters for immediate use.
 * Most applications should use this export rather than creating new LogM8 instances.
 *
 * @example
 * ```typescript
 * import { Logging } from 'log-m8';
 *
 * // Initialize with default console output
 * Logging.init();
 *
 * // Get a logger and start logging
 * const logger = Logging.getLogger('app');
 * logger.info('Application started');
 * ```
 */
const Logging = new LogM8();
export { Logging };
