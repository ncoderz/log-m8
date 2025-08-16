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
 * Configuration for the JSON formatter.
 *
 * Extends the base FormatterConfig with options for selecting which fields to
 * include, pretty printing, timestamp formatting, and output size limits.
 */
export interface JsonFormatterConfig extends FormatterConfig {
  /**
   * Fields to include in the output object.
   * Accepts a single field or an array of fields. Defaults to
   * ['timestamp', 'level', 'logger', 'message', 'data'].
   *
   * Each entry is used as the object key and resolved via dot-path on the LogEvent.
   * Special handling:
   * - 'LEVEL' returns the raw level string (e.g., 'info').
   * - 'timestamp' is formatted with `timestampFormat`.
   *
   * If the list is empty, the entire LogEvent object is used.
   */
  format?: string | string[];

  /**
   * Pretty-print JSON output.
   * - true: default indentation of 2 spaces.
   * - number: use the provided number of spaces.
   * - false/undefined: minified JSON with no extra whitespace.
   */
  pretty?: boolean | number;

  /**
   * Timestamp format pattern or preset.
   * Supports 'iso', 'locale', or custom token patterns (yyyy-MM-dd hh:mm:ss).
   */
  timestampFormat?: string;

  /**
   * Maximum depth for nested objects in JSON output.
   * Defaults to 3.
   */
  maxDepth?: number;

  /**
   * Maximum length for string values in JSON output.
   * Strings longer than this may be truncated by `stringifyLog`. Defaults to 1000.
   */
  maxStringLen?: number;

  /**
   * Maximum length for array values in JSON output.
   * Arrays longer than this may be truncated by `stringifyLog`. Defaults to 100.
   */
  maxArrayLen?: number;
}

/**
 * JSON formatter that emits a single JSON string per log event.
 *
 * Features
 * - Select fields via `format` (e.g., ['timestamp','level','logger','message','data']).
 * - Formats timestamps using `timestampFormat` ('iso', 'locale', or custom pattern).
 * - Pretty printing with fixed (2 spaces) or custom indentation.
 * - Output size controls via `maxDepth`, `maxStringLen`, and `maxArrayLen` (passed to `LogM8Utils.stringifyLog`).
 *
 * Behavior
 * - Returns an array with a single element: the JSON string representation of the selected fields.
 * - Field resolution uses dot-path access on the LogEvent (e.g., 'context.userId').
 * - Special tokens:
 *   - 'timestamp': formatted per `timestampFormat`.
 *   - 'LEVEL': raw level string (lowercase; no color or padding).
 * - If `format` is empty, the entire LogEvent object is serialized.
 *
 * Examples
 *
 * // Default fields, minified JSON
 * formatter.init({});
 * // => ["{\"timestamp\":\"...\",\"level\":\"info\",\"logger\":\"app\",\"message\":\"...\",\"data\":[]}"]
 *
 * // Pretty printed output (2 spaces)
 * formatter.init({ pretty: true });
 *
 * // Custom fields with a nested context property
 * formatter.init({
 *   format: ['timestamp', 'LEVEL', 'logger', 'context.userId', 'message'],
 *   timestampFormat: 'hh:mm:ss.SSS',
 *   pretty: 2,
 * });
 */
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
      // When no fields are specified, fall back to including the entire LogEvent object.
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
