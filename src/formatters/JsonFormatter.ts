import type { Formatter } from '../Formatter.ts';
import type { FormatterConfig } from '../FormatterConfig.ts';
import type { LogEvent } from '../LogEvent.ts';
import { LogM8Utils } from '../LogM8Utils.ts';
import type { PluginFactory } from '../PluginFactory.ts';
import { PluginKind } from '../PluginKind.ts';

const NAME = 'json-formatter';
const VERSION = '1.0.0';
const KIND = PluginKind.formatter;

const DEFAULT_FORMAT = ['timestamp', 'level', 'logger', 'message', 'data'];
const DEFAULT_TIMESTAMP_FORMAT = 'iso';
const DEFAULT_PRETTY = 2;
const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_MAX_STRING_LEN = 1000;
const DEFAULT_MAX_ARRAY_LEN = 100;

/**
 * Configuration interface for the default formatter.
 *
 * Extends base FormatterConfig with options for template customization,
 * output format selection, and visual styling.
 */
export interface JsonFormatterConfig extends FormatterConfig {
  format?: string | string[];

  pretty?: boolean | number;

  /**
   * Timestamp format pattern or preset.
   * Supports 'iso', 'locale', or custom token patterns (yyyy-MM-dd hh:mm:ss).
   */
  timestampFormat?: string;

  /**
   * Maximum depth for nested objects in JSON output.
   */
  maxDepth?: number;

  /**
   * Maximum length for string values in JSON output.
   */
  maxStringLen?: number;

  /**
   * Maximum length for array values in JSON output.
   */
  maxArrayLen?: number;
}

class JsonFormatter implements Formatter {
  public name = NAME;
  public version = VERSION;
  public kind = KIND;

  private _config!: JsonFormatterConfig;
  private _format!: string[];
  private _pretty: number | undefined;
  private _maxDepth: number = DEFAULT_MAX_DEPTH;
  private _maxStringLen: number = DEFAULT_MAX_STRING_LEN;
  private _maxArrayLen: number = DEFAULT_MAX_ARRAY_LEN;
  private _timestampFormat: string = DEFAULT_TIMESTAMP_FORMAT;

  public init(config: JsonFormatterConfig): void {
    this._config = Object.assign({}, config);

    this._pretty =
      this._config.pretty === true
        ? DEFAULT_PRETTY
        : this._config.pretty
          ? this._config.pretty
          : undefined;
    this._maxDepth = this._config.maxDepth ?? DEFAULT_MAX_DEPTH;
    this._maxStringLen = this._config.maxStringLen ?? DEFAULT_MAX_STRING_LEN;
    this._maxArrayLen = this._config.maxArrayLen ?? DEFAULT_MAX_ARRAY_LEN;

    let formatConfig = (this._config.format ?? DEFAULT_FORMAT) as string[];
    if (typeof this._config.format === 'string') formatConfig = [this._config.format];
    this._format = formatConfig;

    this._timestampFormat = this._config.timestampFormat ?? DEFAULT_TIMESTAMP_FORMAT;
  }

  public dispose(): void {}

  public format(logEvent: LogEvent): unknown[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let outputObj: any = {};

    const formatArr = this._format;
    if (formatArr.length > 0) {
      formatArr.forEach((item) => {
        const t = this.resolveToken(item, logEvent);
        if (t != undefined) {
          outputObj[t.key] = t.value;
        }
      });
    } else {
      outputObj = logEvent;
    }

    return [
      LogM8Utils.stringifyLog(
        outputObj,
        {
          maxDepth: this._maxDepth,
          maxStringLength: this._maxStringLen,
          maxArrayLength: this._maxArrayLen,
        },
        this._pretty,
      ),
    ];
  }

  private resolveToken(
    part: string,
    logEvent: LogEvent,
  ): { key: string; value: unknown } | undefined {
    // Process tokens for JSON object construction
    const key = part;
    if (key === 'LEVEL') {
      return { key, value: logEvent.level };
    } else if (key === 'timestamp') {
      const raw = LogM8Utils.getPropertyByPath(logEvent, key);
      return { key, value: LogM8Utils.formatTimestamp(raw as Date, this._timestampFormat) };
    }
    // Resolve properties via dot-path notation
    return { key, value: LogM8Utils.getPropertyByPath(logEvent, key) };
  }
}

class JsonFormatterFactory implements PluginFactory<JsonFormatterConfig, JsonFormatter> {
  public name = NAME;
  public version = VERSION;
  public kind = KIND;

  public create(config: JsonFormatterConfig): JsonFormatter {
    const appender = new JsonFormatter();
    appender.init(config);
    return appender;
  }
}

export { JsonFormatterFactory };
