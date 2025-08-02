import type { Formatter } from '../Formatter.ts';
import type { FormatterConfig } from '../FormatterConfig.ts';
import type { LogEvent } from '../LogEvent.ts';
import { PluginKind } from '../PluginKind.ts';

class DefaultFormatter implements Formatter {
  public name = 'default';
  public version = '1.0.0';
  public kind = PluginKind.formatter;

  private _config?: FormatterConfig;

  public init(config: FormatterConfig): void {
    this._config = config;
  }

  public dispose(): void {
    // No resources to dispose for console appender
  }

  public format(logEvent: LogEvent): unknown[] {
    return [
      logEvent.timestamp.toISOString(),
      logEvent.level,
      logEvent.logger,
      ...logEvent.data,
      logEvent.context ? JSON.stringify(logEvent.context) : undefined,
    ];
  }
}

export { DefaultFormatter };
