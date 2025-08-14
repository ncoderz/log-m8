import { Enum } from '@ncoderz/superenum';

import { ConsoleAppenderFactory } from './appenders/ConsoleAppender.ts';
import { FileAppenderFactory } from './appenders/FileAppender.ts';
import { MatchFilterFactory } from './filters/MatchFilter.ts';
import { DefaultFormatterFactory } from './formatters/DefaultFormatter.ts';
import type { Appender, AppenderConfig, Filter, Formatter } from './index.ts';
import type { Log } from './Log.ts';
import type { LogContext } from './LogContext.ts';
import type { LogEvent } from './LogEvent.ts';
import type { LoggingConfig } from './LoggingConfig.ts';
import type { LogImpl } from './LogImpl.ts';
import { LogLevel, type LogLevelType } from './LogLevel.ts';
import type { PluginFactory } from './PluginFactory.ts';
import { PluginKind } from './PluginKind.ts';
import { PluginManager } from './PluginManager.ts';

const MAX_LOG_BUFFER_SIZE = 100; // Maximum size of the log buffer before dropping events
const DEFAULT_APPENDERS = [
  {
    name: 'console',
    formatter: 'default',
  },
];

/**
 * Central logging manager providing hierarchical loggers and configurable output.
 *
 * LogM8 manages the complete logging lifecycle including:
 * - Logger creation and configuration with hierarchical naming
 * - Plugin-based appender, formatter, and filter system
 * - Pre-initialization event buffering (up to 100 events)
 * - Runtime appender and filter control (enable/disable/flush)
 * - Built-in console and file appenders with customizable formatting
 *
 * The manager operates as a singleton export but can also be instantiated directly.
 * Events logged before init() are buffered and flushed on first post-init log.
 *
 * @example
 * ```typescript
 * import { Logging } from 'log-m8';
 *
 * // Configure logging system
 * Logging.init({
 *   level: 'info',
 *   loggers: { 'app.database': 'debug' },
 *   appenders: [
 *     { name: 'console', formatter: 'default' },
 *     { name: 'file', filename: 'app.log' }
 *   ]
 * });
 *
 * // Use hierarchical loggers
 * const logger = Logging.getLogger('app.service');
 * logger.info('Service started');
 *
 * // Runtime control
 * Logging.disableAppender('console');
 * Logging.disableFilter('sensitive-data');
 * Logging.flushAppenders();
 * ```
 */
class LogM8 {
  private _initialized = false;
  private _pluginManager: PluginManager = new PluginManager();
  private _loggers: Map<string, Log> = new Map();
  private _appenders: Appender[] = [];
  private _filters: Filter[] = [];

  private _defaultLevel: LogLevelType = LogLevel.info;
  private _logLevelValues = Enum(LogLevel).values();

  // Buffer for log events before the system is initialized
  private _logBuffer: LogEvent[] = [];

  constructor() {
    // Register built-in plugin factories for console/file appenders and default formatter
    this._pluginManager.registerPluginFactory(new ConsoleAppenderFactory());
    this._pluginManager.registerPluginFactory(new FileAppenderFactory());
    this._pluginManager.registerPluginFactory(new DefaultFormatterFactory());
    this._pluginManager.registerPluginFactory(new MatchFilterFactory());
  }

  /**
   * Initializes the logging system with configuration and flushes any buffered events.
   *
   * Sets up default and per-logger levels, creates configured appenders with their
   * formatters and filters, and processes any events buffered before initialization.
   * Appenders are sorted by priority (descending) for deterministic execution order.
   *
   * @param config - Logging configuration object
   * @param config.level - Default log level for all loggers ('info' if not specified)
   * @param config.loggers - Per-logger level overrides by name
   * @param config.appenders - Appender configurations (defaults to console if not specified)
   *
   * @throws {Error} When referenced plugin factories are not registered
   *
   * @example
   * ```typescript
   * Logging.init({
   *   level: 'warn',
   *   loggers: { 'app.database': 'debug' },
   *   appenders: [{
   *     name: 'console',
   *     formatter: 'default',
   *     filters: ['sensitive-data']
   *   }]
   * });
   * ```
   */
  public init(config?: LoggingConfig): void {
    config = Object.assign({}, config);

    this._reset();

    // Set the default logging level
    this._defaultLevel = Enum(LogLevel).fromValue(config.level) ?? LogLevel.info;

    // Set up loggers
    for (const [name, level] of Object.entries(config.loggers ?? {})) {
      const logger = this.getLogger(name);
      const l = Enum(LogLevel).fromValue(level) ?? this._defaultLevel;
      logger.setLevel(l);
    }

    // Set up appenders
    const appenderConfigs = config.appenders ?? DEFAULT_APPENDERS;
    for (const appenderConfig of appenderConfigs) {
      const appender = this._pluginManager.createPlugin(
        PluginKind.appender,
        appenderConfig,
      ) as Appender;

      const formatter = appenderConfig.formatter
        ? (this._pluginManager.createPlugin(
            PluginKind.formatter,
            appenderConfig.formatter,
          ) as Formatter)
        : undefined;

      const filters: Filter[] = [];
      const ac = appenderConfig as AppenderConfig;
      for (const filterConfig of ac.filters ?? []) {
        const filter = this._pluginManager.createPlugin(PluginKind.filter, filterConfig);
        if (filter) {
          filters.push(filter as Filter);
        } else {
          if (console && console.log) {
            console.log(
              `LogM8: Filter '${filterConfig}' not found for appender ${appenderConfig.name}.`,
            );
          }
        }
      }

      appender.init(appenderConfig, formatter, filters);
      this._appenders.push(appender);
    }

    // Sort the appenders by their priority
    this._sortAppenders();

    // Set up global filters
    for (const filterConfig of config.filters ?? []) {
      const filter = this._pluginManager.createPlugin(PluginKind.filter, filterConfig);
      if (filter) {
        this._filters.push(filter as Filter);
      } else {
        if (console && console.log) {
          console.log(`LogM8: Filter '${filterConfig}' not found (global).`);
        }
      }
    }

    this._initialized = true;
  }

  /**
   * Shuts down the logging system and releases all resources.
   *
   * Flushes all appenders, disposes plugin instances, clears logger registry,
   * discards buffered events, and deregisters plugin factories. The system
   * can be reinitialized after disposal.
   *
   * @example
   * ```typescript
   * // Graceful shutdown
   * await new Promise(resolve => {
   *   Logging.flushAppenders();
   *   setTimeout(() => {
   *     Logging.dispose();
   *     resolve();
   *   }, 100);
   * });
   * ```
   */
  public dispose(): void {
    // Reset to initial state (flushes appenders, disposes all plugins)
    this._reset();

    // Clear the log buffer
    this._logBuffer = [];

    // Deregister all plugin factories
    this._pluginManager.clearFactories();

    this._initialized = false;
  }

  /**
   * Retrieves or creates a logger instance with hierarchical naming.
   *
   * Logger instances are cached and reused for the same name. Names can be
   * provided as strings with dot-separation or as array segments that get
   * joined. Each logger maintains independent level and context settings.
   *
   * @param name - Logger name as string ('app.service') or segments (['app', 'service'])
   * @returns Logger instance for the specified name
   *
   * @example
   * ```typescript
   * const logger1 = Logging.getLogger('app.database');
   * const logger2 = Logging.getLogger(['app', 'database']);
   * // logger1 === logger2 (same instance)
   *
   * logger1.setLevel('debug');
   * logger1.setContext({ service: 'postgres' });
   * ```
   */
  public getLogger(name: string | string[]): Log {
    let nameStr: string = name as string;
    if (Array.isArray(name)) {
      nameStr = name.join('.');
    }

    const existingLogger = this._loggers.get(nameStr);
    if (existingLogger) return existingLogger;

    const logger: LogImpl = {
      name: nameStr,
      level: this._defaultLevel,
      context: {},
    } as LogImpl;

    logger.fatal = this._log.bind(this, logger, LogLevel.fatal);
    logger.error = this._log.bind(this, logger, LogLevel.error);
    logger.warn = this._log.bind(this, logger, LogLevel.warn);
    logger.info = this._log.bind(this, logger, LogLevel.info);
    logger.debug = this._log.bind(this, logger, LogLevel.debug);
    logger.trace = this._log.bind(this, logger, LogLevel.trace);
    logger.track = this._log.bind(this, logger, LogLevel.track);

    logger.setLevel = this._setLevel.bind(this, logger);
    logger.setContext = this._setContext.bind(this, logger);
    logger.getLogger = (name) => this.getLogger([logger.name, name]);

    // Set initial level and context
    this._setLevel(logger, this._defaultLevel);

    this._loggers.set(logger.name, logger);

    return logger;
  }

  /**
   * Enables an appender to resume processing log events.
   *
   * @param name - Name of the appender to enable
   */
  public enableAppender(name: string): void {
    const appender = this._getAppender(name);
    if (!appender) return;
    appender.enabled = true;
  }

  /**
   * Disables an appender to stop processing log events.
   *
   * @param name - Name of the appender to disable
   */
  public disableAppender(name: string): void {
    const appender = this._getAppender(name);
    if (!appender) return;
    appender.enabled = false;
  }

  /**
   * Forces an appender to flush any buffered output.
   *
   * Catches and logs flush errors to console without interrupting operation.
   * Useful for ensuring data persistence before shutdown or at intervals.
   *
   * @param name - Name of the appender to flush
   */
  public flushAppender(name: string): void {
    const appender = this._getAppender(name);
    if (!appender) return;
    try {
      appender.flush();
    } catch (err) {
      if (console && console.error) {
        console.error(`LogM8: Failed to flush appender: ${appender.name}:`, err);
      }
    }
  }

  /**
   * Flushes all configured appenders.
   *
   * Iterates through all appenders calling flush on each, with individual
   * error handling per appender.
   */
  public flushAppenders(): void {
    for (const appender of this._appenders) {
      this.flushAppender(appender.name);
    }
  }

  /**
   * Enables a filter to resume processing log events.
   *
   * When an appender name is provided, enables the filter only for that specific
   * appender. When no appender is specified, enables the filter globally.
   * Silently ignores requests for non-existent filters or appenders.
   *
   * @param name - Name of the filter to enable
   * @param appenderName - Optional appender name to enable filter for specific appender only
   *
   * @example
   * ```typescript
   * // Enable filter globally
   * Logging.enableFilter('sensitive-data');
   *
   * // Enable filter only for console appender
   * Logging.enableFilter('debug-filter', 'console');
   * ```
   */
  public enableFilter(name: string, appenderName?: string): void {
    if (appenderName) {
      this._getAppender(appenderName)?.enableFilter(name);
      return;
    }
    const filter = this._getFilter(name);
    if (!filter) return;
    filter.enabled = true;
  }

  /**
   * Disables a filter to stop processing log events.
   *
   * When an appender name is provided, disables the filter only for that specific
   * appender. When no appender is specified, disables the filter globally.
   * Silently ignores requests for non-existent filters or appenders.
   *
   * @param name - Name of the filter to disable
   * @param appenderName - Optional appender name to disable filter for specific appender only
   *
   * @example
   * ```typescript
   * // Disable filter globally
   * Logging.disableFilter('sensitive-data');
   *
   * // Disable filter only for file appender
   * Logging.disableFilter('debug-filter', 'file');
   * ```
   */
  public disableFilter(name: string, appenderName?: string): void {
    if (appenderName) {
      this._getAppender(appenderName)?.disableFilter(name);
      return;
    }
    const filter = this._getFilter(name);
    if (!filter) return;
    filter.enabled = false;
  }

  /**
   * Registers a custom plugin factory for appenders, formatters, or filters.
   *
   * Allows extending the logging system with custom implementations.
   * Must be called before init() to be available during configuration.
   *
   * @param pluginFactory - Factory instance implementing the PluginFactory interface
   *
   * @example
   * ```typescript
   * class SlackAppenderFactory implements PluginFactory {
   *   name = 'slack';
   *   kind = PluginKind.appender;
   *   create(config) { return new SlackAppender(config); }
   * }
   *
   * Logging.registerPluginFactory(new SlackAppenderFactory());
   * ```
   */
  public registerPluginFactory(pluginFactory: PluginFactory): void {
    this._pluginManager.registerPluginFactory(pluginFactory);
  }

  private _log(
    logger: LogImpl,
    level: LogLevelType,
    message: string | unknown,
    ...data: unknown[]
  ): void {
    // Early return if level not enabled - O(1) performance for disabled logs
    const levelNumber = this._logLevelValues.indexOf(level);
    if (levelNumber > logger._levelNumber) return;

    // Create a log event for the log
    const logEvent: LogEvent = {
      logger: logger.name,
      level,
      message,
      data,
      context: logger.context,
      timestamp: new Date(),
    };

    if (this._initialized) {
      // Process buffered log events first (FIFO order)
      if (this._logBuffer.length > 0) {
        for (const bufferedEvent of this._logBuffer) {
          this._processLogEvent(bufferedEvent);
        }
        this._logBuffer = []; // Clear the buffer after processing
      }

      // Process the log event immediately
      this._processLogEvent(logEvent);
    } else {
      // Buffer the log events until initialization is complete
      if (this._logBuffer.length >= MAX_LOG_BUFFER_SIZE) {
        this._logBuffer.shift(); // Drop the oldest event if buffer is full
      }
      this._logBuffer.push(logEvent);
    }
  }

  private _setLevel(logger: LogImpl, level: LogLevelType): void {
    logger.level = level;
    logger._levelNumber = this._logLevelValues.indexOf(level);

    logger.isEnabled = level !== LogLevel.off;
    // Boolean flags indicate enablement for that severity level and above
    const levelNumber = logger._levelNumber;
    logger.isFatal = this._logLevelValues.indexOf(LogLevel.fatal) <= levelNumber;
    logger.isError = this._logLevelValues.indexOf(LogLevel.error) <= levelNumber;
    logger.isWarn = this._logLevelValues.indexOf(LogLevel.warn) <= levelNumber;
    logger.isInfo = this._logLevelValues.indexOf(LogLevel.info) <= levelNumber;
    logger.isDebug = this._logLevelValues.indexOf(LogLevel.debug) <= levelNumber;
    logger.isTrack = this._logLevelValues.indexOf(LogLevel.track) <= levelNumber;
    logger.isTrace = this._logLevelValues.indexOf(LogLevel.trace) <= levelNumber;
  }

  private _setContext(logger: LogImpl, context: LogContext): void {
    logger.context = context ?? {};
  }

  private _processLogEvent(event: LogEvent): void {
    // Filter
    for (const filter of this._filters) {
      if (filter.enabled && !filter.filter(event)) {
        return; // Skip if any filter denies logging
      }
    }

    // Process each appender (they should be in their priority order)
    for (const appender of this._appenders) {
      try {
        if (!appender.enabled) continue;
        if (!appender.supportedLevels.has(event.level)) continue;
        appender.write(event);
      } catch (err) {
        if (console && console.log) {
          console.log(`LogM8: Failed to append log with '${appender.name}':`, err);
        }
      }
    }
  }

  private _getAppender(name: string): Appender | undefined {
    return this._appenders.find((a) => a.name === name);
  }

  private _sortAppenders(): void {
    // Sort by descending priority - higher numbers execute first
    this._appenders.sort((a, b) => {
      const aPriority = a?.priority ?? 0;
      const bPriority = b?.priority ?? 0;
      return bPriority - aPriority; // Higher priority first
    });
  }

  private _getFilter(name: string): Filter | undefined {
    return this._filters.find((f) => f.name === name);
  }

  private _reset(): void {
    // FLush all appenders before disposing
    this.flushAppenders();

    this._appenders = [];
    this._loggers.clear();
    this._defaultLevel = LogLevel.info;

    // Dispose all plugins
    this._pluginManager.disposePlugins();
  }
}

export { LogM8 };
