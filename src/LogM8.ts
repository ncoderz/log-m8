import { Enum } from '@ncoderz/superenum';

import { ConsoleAppender } from './appenders/ConsoleAppender.ts';
import { DefaultFormatter } from './formatters/DefaultFormatter.ts';
import type { Appender, Filter, Formatter } from './index.ts';
import type { Log } from './Log.ts';
import type { LogContext } from './LogContext.ts';
import type { LogEvent } from './LogEvent.ts';
import type { LoggingConfig } from './LoggingConfig.ts';
import type { LogImpl } from './LogImpl.ts';
import { LogLevel, type LogLevelType } from './LogLevel.ts';
import type { Plugin } from './Plugin.ts';
import { PluginKind, type PluginKindType } from './PluginKind.ts';

class LogM8 {
  private _plugins: Map<string, Plugin> = new Map();
  private _appenders: Appender[] = [];
  private _loggers: Map<string, Log> = new Map();

  private _defaultLevel: LogLevelType = LogLevel.info;
  private _asyncBufferingEnabled: boolean = false;
  private _logLevelValues = Enum(LogLevel).values();

  constructor() {
    // Register built-in plugins

    // Appenders
    this.registerPlugin(new ConsoleAppender());

    // Formatters
    this.registerPlugin(new DefaultFormatter());
  }

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

    // Set up filters
    for (const filterConfig of config.filters ?? []) {
      const filter = this._plugins.get(filterConfig.name) as Filter;
      if (filter) {
        filter.init(filterConfig);
      } else {
        if (console && console.log) {
          console.log(`LogM8: Filter '${filterConfig.name}' not found.`);
        }
      }
    }

    // Set up formatters
    for (const formatterConfig of config.formatters ?? []) {
      const formatter = this._plugins.get(formatterConfig.name) as Formatter;
      if (formatter) {
        formatter.init(formatterConfig);
      } else {
        if (console && console.log) {
          console.log(`LogM8: Formatter '${formatterConfig.name}' not found.`);
        }
      }
    }

    // Set up appenders
    const appenderConfigs = config.appenders ?? [
      {
        name: 'console',
        formatter: 'default',
      },
    ];
    for (const appenderConfig of appenderConfigs) {
      const appender = this._plugins.get(appenderConfig.name) as Appender;
      if (appender) {
        const formatter = appenderConfig.formatter
          ? (this._plugins.get(appenderConfig.formatter) as Formatter)
          : undefined;

        const filters: Filter[] = [];
        for (const filterName of appenderConfig.filters ?? []) {
          const filter = this._plugins.get(filterName) as Filter | undefined;
          if (filter) {
            filters.push(filter);
          } else {
            if (console && console.log) {
              console.log(
                `LogM8: Filter '${filterName}' not found for appender ${appenderConfig.name}.`,
              );
            }
          }
        }

        appender.init(appenderConfig, formatter, filters);
        this._appenders.push(appender);
      } else {
        if (console && console.log) {
          console.log(`LogM8: Appender '${appenderConfig.name}' not found.`);
        }
      }
    }
    // Sort the appenders by their priority
    this._sortAppenders();
  }

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

  public enableAppender(name: string): void {
    const appender = this._getAppender(name);
    if (!appender) return;
    if (this._appenders.some((a) => a.name === appender.name)) return;
    this._appenders.push(appender);

    // Sort the appenders by their priority
    this._sortAppenders();
  }

  public disableAppender(name: string): void {
    const index = this._appenders.findIndex((appender) => appender.name === name);
    if (index !== -1) {
      this._appenders.splice(index, 1);
    }
  }

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

  public flushAppenders(): void {
    for (const appender of this._appenders) {
      this.flushAppender(appender.name);
    }
  }

  public enableAsync() {
    this._asyncBufferingEnabled = true;
  }

  public disableAsync() {
    this._asyncBufferingEnabled = false;

    // TODO: Flush any buffered logs
  }

  public registerPlugin(plugin: Plugin): void {
    if (this._plugins.has(plugin.name)) {
      throw new Error(`LogM8: Plugin with name ${plugin.name} is already registered.`);
    }
    this._plugins.set(plugin.name, plugin);
  }

  private _log(logger: LogImpl, level: LogLevelType, ...data: unknown[]): void {
    const levelNumber = this._logLevelValues.indexOf(level);
    if (levelNumber > logger._levelNumber) return;

    // Create a log event for the log
    const logEvent: LogEvent = {
      logger: logger.name,
      level,
      data,
      context: logger.context,
      timestamp: new Date(),
    };

    if (this._asyncBufferingEnabled) {
      // TODO - pass to async buffer
    } else {
      // Process the log event immediately
      this._processLogEvent(logEvent);
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
        appender.write(event);
      } catch (err) {
        if (console && console.log) {
          console.log(`LogM8: Failed to append log with '${appender.name}':`, err);
        }
      }
    }
  }

  private _getAppender(name: string): Appender | undefined {
    return this._getPlugin(name, PluginKind.appender) as Appender;
  }

  private _getFormatter(name: string): Formatter | undefined {
    return this._getPlugin(name, PluginKind.formatter) as Formatter;
  }

  private _getFilter(name: string): Filter | undefined {
    return this._getPlugin(name, PluginKind.filter) as Filter;
  }

  private _getPlugin(name: string, kind: PluginKindType): Plugin | undefined {
    const plugin = this._plugins.get(name);
    if (!plugin || kind !== PluginKind.appender) return;
    return plugin;
  }

  private _sortAppenders(): void {
    this._appenders.sort((a, b) => {
      const aPriority = a?.getPriority() ?? 0;
      const bPriority = b?.getPriority() ?? 0;
      return bPriority - aPriority; // Higher priority first
    });
  }

  private _reset(): void {
    this._appenders = [];
    this._loggers.clear();
    this._defaultLevel = LogLevel.info;
    this._asyncBufferingEnabled = false;
  }
}

export { LogM8 };
