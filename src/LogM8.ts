import { Enum } from '@ncoderz/superenum';

import { ConsoleAppenderFactory } from './appenders/ConsoleAppender.ts';
import { FileAppenderFactory } from './appenders/FileAppender.ts';
import { DefaultFormatterFactory } from './formatters/DefaultFormatter.ts';
import type { Appender, AppenderConfig, Filter, Formatter, PluginConfig } from './index.ts';
import type { Log } from './Log.ts';
import type { LogContext } from './LogContext.ts';
import type { LogEvent } from './LogEvent.ts';
import type { LoggingConfig } from './LoggingConfig.ts';
import type { LogImpl } from './LogImpl.ts';
import { LogLevel, type LogLevelType } from './LogLevel.ts';
import type { Plugin } from './Plugin.ts';
import type { PluginFactory } from './PluginFactory.ts';
import { PluginKind, type PluginKindType } from './PluginKind.ts';

const DEFAULT_APPENDERS = [
  {
    name: 'console',
    formatter: 'default',
  },
];

class LogM8 {
  private _pluginFactories: Map<string, PluginFactory> = new Map();
  private _plugins: Plugin[] = [];
  private _appenders: Appender[] = [];
  private _loggers: Map<string, Log> = new Map();

  private _defaultLevel: LogLevelType = LogLevel.info;
  private _asyncBufferingEnabled: boolean = false;
  private _logLevelValues = Enum(LogLevel).values();

  constructor() {
    // Register built-in plugin factories

    // Appenders
    this.registerPluginFactory(new ConsoleAppenderFactory());
    this.registerPluginFactory(new FileAppenderFactory());

    // Formatters
    this.registerPluginFactory(new DefaultFormatterFactory());
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

    // Set up appenders
    const appenderConfigs = config.appenders ?? DEFAULT_APPENDERS;
    for (const appenderConfig of appenderConfigs) {
      const appender = this._createPlugin(PluginKind.appender, appenderConfig) as Appender;

      const formatter = appenderConfig.formatter
        ? (this._createPlugin(PluginKind.formatter, appenderConfig.formatter) as Formatter)
        : undefined;

      const filters: Filter[] = [];
      const ac = appenderConfig as AppenderConfig;
      for (const filterConfig of ac.filters ?? []) {
        const filter = this._createPlugin(PluginKind.filter, filterConfig);
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
  }

  public dispose(): void {
    // Reset to initial state (flushes appenders, disposes all plugins)
    this._reset();

    // Deregister all plugin factories
    this._pluginFactories.clear();
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
    appender.enabled = true;
  }

  public disableAppender(name: string): void {
    const appender = this._getAppender(name);
    if (!appender) return;
    appender.enabled = false;
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

  public registerPluginFactory(pluginFactory: PluginFactory): void {
    if (this._pluginFactories.has(pluginFactory.name)) {
      throw new Error(`LogM8: Plugin with name ${pluginFactory.name} is already registered.`);
    }
    this._pluginFactories.set(pluginFactory.name, pluginFactory);
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

  private _createPlugin(kind: PluginKindType, nameOrConfig: string | PluginConfig): Plugin {
    const name = typeof nameOrConfig === 'string' ? nameOrConfig : nameOrConfig.name;
    const config = typeof nameOrConfig === 'string' ? { name } : nameOrConfig;
    const pluginFactory = this._getPluginFactory(name, kind);
    if (!pluginFactory) {
      throw new Error(`LogM8: Plugin factory kind '${kind}' with name '${name}' not found.`);
    }
    const plugin = pluginFactory.create(config);

    this._plugins.push(plugin);

    return plugin;
  }

  private _getPluginFactory(name: string, kind: PluginKindType): PluginFactory | undefined {
    const pluginFactory = this._pluginFactories.get(name);
    if (!pluginFactory || kind !== pluginFactory.kind) return;
    return pluginFactory;
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
    this._asyncBufferingEnabled = false;

    // Dispose all plugins
    this._plugins.forEach((plugin) => {
      plugin.dispose();
    });
    this._plugins = [];
  }
}

export { LogM8 };
