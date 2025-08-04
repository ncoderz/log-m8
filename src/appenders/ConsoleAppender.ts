import type { Appender } from '../Appender.ts';
import type { AppenderConfig } from '../AppenderConfig.ts';
import type { Filter } from '../Filter.ts';
import type { Formatter } from '../Formatter.ts';
import type { LogEvent } from '../LogEvent.ts';
import { LogLevel, type LogLevelType } from '../LogLevel.ts';
import type { PluginFactory } from '../PluginFactory.ts';
import { PluginKind } from '../PluginKind.ts';

const NAME = 'console';
const VERSION = '1.0.0';
const KIND = PluginKind.appender;

const SUPPORTED_LEVELS = new Set<LogLevelType>([
  LogLevel.fatal,
  LogLevel.error,
  LogLevel.warn,
  LogLevel.info,
  LogLevel.debug,
  LogLevel.track,
  LogLevel.trace,
]);

interface ConsoleAppenderConfig extends AppenderConfig {
  //
}

class ConsoleAppender implements Appender {
  public name = NAME;
  public version = VERSION;
  public kind = KIND;

  public readonly supportedLevels = SUPPORTED_LEVELS;
  public enabled = true;
  public priority?: number;

  private _config?: AppenderConfig;
  private _formatter?: Formatter;
  private _filters: Filter[] = [];
  private _available = true;

  private off = () => {};
  private fatal = console.error ? console.error.bind(console) : console.log.bind(console);
  private error = console.error ? console.error.bind(console) : console.log.bind(console);
  private warn = console.warn ? console.warn.bind(console) : console.log.bind(console);
  private info = console.info ? console.info.bind(console) : console.log.bind(console);
  private debug = console.debug ? console.debug.bind(console) : console.log.bind(console);
  private trace = console.trace ? console.trace.bind(console) : console.log.bind(console);
  private track = console.log.bind(console);

  public init(config: AppenderConfig, formatter?: Formatter, filters?: Filter[]): void {
    this._config = config;
    this._formatter = formatter;
    this._filters = filters || [];
    this._available = typeof console !== 'undefined' && !!console.log;

    this.enabled = this._config?.enabled === false ? false : true;
    this.priority = this._config?.priority;
  }

  public dispose(): void {
    // No resources to dispose for console appender
  }

  public write(event: LogEvent): void {
    if (!this._available) return;

    const data = this._format(event);

    // Log
    this[event.level](...data);
  }

  public flush(): void {
    // No-op for console appender
  }

  private _format(event: LogEvent): unknown[] {
    return this._formatter ? this._formatter.format(event) : [event];
  }
}

class ConsoleAppenderFactory implements PluginFactory<ConsoleAppenderConfig, ConsoleAppender> {
  public name = NAME;
  public version = VERSION;
  public kind = KIND;

  public create(config: AppenderConfig): ConsoleAppender {
    const appender = new ConsoleAppender();
    appender.init(config);
    return appender;
  }
}

export { ConsoleAppender, ConsoleAppenderFactory };
