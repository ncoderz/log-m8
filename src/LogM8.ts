import { Enum } from '@ncoderz/superenum';

import { ConsoleAppenderFactory } from './appenders/ConsoleAppender.ts';
import { FileAppenderFactory } from './appenders/FileAppender.ts';
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
 * Core logging manager that configures and dispatches log events to appenders.
 * Manages loggers, appenders, formatters, and filters.
 */
class LogM8 {
  private _initialized = false;
  private _pluginManager: PluginManager = new PluginManager();
  private _appenders: Appender[] = [];
  private _loggers: Map<string, Log> = new Map();

  private _defaultLevel: LogLevelType = LogLevel.info;
  private _logLevelValues = Enum(LogLevel).values();

  // Buffer for log events before the system is initialized
  private _logBuffer: LogEvent[] = [];

  constructor() {
    // Register built-in plugin factories

    // Appenders
    this._pluginManager.registerPluginFactory(new ConsoleAppenderFactory());
    this._pluginManager.registerPluginFactory(new FileAppenderFactory());

    // Formatters
    this._pluginManager.registerPluginFactory(new DefaultFormatterFactory());
  }

  /**
   * Initializes logging with the provided configuration, sets default levels, loggers, and appenders.
   * @param config - Optional logging configuration.
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

    this._initialized = true;
  }

  /**
   * Disposes the logging system, flushing appenders and deregistering plugin factories.
   */
  public dispose(): void {
    // Reset to initial state (flushes appenders, disposes all plugins)
    this._reset();

    // Deregister all plugin factories
    this._pluginManager.clearFactories();

    this._initialized = false;
  }

  /**
   * Returns or creates a logger instance by name (or name segments).
   * @param name - Logger name or array of name segments.
   * @returns The logger instance for the given name.
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
   * Enables the specified appender by its name.
   * @param name - The name of the appender to enable.
   */
  public enableAppender(name: string): void {
    const appender = this._getAppender(name);
    if (!appender) return;
    appender.enabled = true;
  }

  /**
   * Disables the specified appender by its name.
   * @param name - The name of the appender to disable.
   */
  public disableAppender(name: string): void {
    const appender = this._getAppender(name);
    if (!appender) return;
    appender.enabled = false;
  }

  /**
   * Flushes the specified appender, catching and logging any errors.
   * @param name - The name of the appender to flush.
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
   */
  public flushAppenders(): void {
    for (const appender of this._appenders) {
      this.flushAppender(appender.name);
    }
  }

  /**
   * Registers a plugin factory for custom plugins.
   * @param pluginFactory - The plugin factory to register.
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
      // Process buffered log events first
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
    logger.isFatal = level === LogLevel.fatal;
    logger.isError = level === LogLevel.error;
    logger.isWarn = level === LogLevel.warn;
    logger.isInfo = level === LogLevel.info;
    logger.isDebug = level === LogLevel.debug;
    logger.isTrack = level === LogLevel.track;
    logger.isTrace = level === LogLevel.trace;
  }

  private _setContext(logger: LogImpl, context: LogContext): void {
    logger.context = context ?? {};
  }

  private _processLogEvent(event: LogEvent): void {
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
    return this._appenders.find((appender) => appender.name === name);
  }

  private _sortAppenders(): void {
    this._appenders.sort((a, b) => {
      const aPriority = a?.priority ?? 0;
      const bPriority = b?.priority ?? 0;
      return bPriority - aPriority; // Higher priority first
    });
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
