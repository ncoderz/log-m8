import { Enum } from '@ncoderz/superenum';

import type { Formatter } from '../Formatter.ts';
import type { FormatterConfig } from '../FormatterConfig.ts';
import type { LogEvent } from '../LogEvent.ts';
import { LogLevel } from '../LogLevel.ts';
import { LogM8Utils } from '../LogM8Utils.ts';
import type { PluginFactory } from '../PluginFactory.ts';
import { PluginKind } from '../PluginKind.ts';

const NAME = 'default-formatter';
const VERSION = '1.0.0';
const KIND = PluginKind.formatter;

const DEFAULT_FORMAT = ['{timestamp} {LEVEL} [{logger}]', '{message}', '{data}'];
const DEFAULT_TIMESTAMP_FORMAT = 'hh:mm:ss.SSS';

/**
 * Configuration interface for the default formatter.
 *
 * Extends base FormatterConfig with options for template customization,
 * output format selection, and visual styling.
 */
export interface DefaultFormatterConfig extends FormatterConfig {
  /**
   * Custom format template(s) using token syntax.
   * Single string or array of template strings for multi-line output.
   * Defaults to readable text format or JSON field list based on json flag.
   */
  format?: string | string[];

  /**
   * Timestamp format pattern or preset.
   * Supports 'iso', 'locale', or custom token patterns (yyyy-MM-dd hh:mm:ss).
   */
  timestampFormat?: string;

  /**
   * Enable colorized output using ANSI codes (Node.js) or CSS styles (browser).
   * Applies colors to log level indicators for improved readability.
   */
  color?: boolean;
}

/**
 * Built-in formatter providing flexible text and JSON output with token-based templates.
 *
 * Supports customizable format templates using token substitution, automatic environment
 * detection for color support, timestamp formatting, and dual-mode output (text/JSON).
 * The default choice for most logging scenarios with sensible defaults and extensive
 * customization options.
 *
 * Token syntax:
 * - {timestamp}: Formatted timestamp using timestampFormat setting
 * - {LEVEL}: Uppercase level name with optional colorization
 * - {level}: Lowercase level name
 * - {logger}: Logger name
 * - {message}: Primary log message
 * - {data}: Additional data arguments (expands to multiple items in text mode)
 * - {context.*}: Nested context properties (e.g., {context.userId})
 *
 * Color support:
 * - Node.js: ANSI escape codes for terminal colors
 * - Browser: CSS style strings for console.log formatting
 * - Automatic detection of environment capabilities
 *
 * @example
 * ```typescript
 * // Text mode with colors (default)
 * formatter.init({
 *   format: '{timestamp} {LEVEL} [{logger}] {message}',
 *   timestampFormat: 'hh:mm:ss.SSS',
 *   color: true
 * });
 *
 * // JSON mode for structured logging
 * formatter.init({
 *   json: true,
 *   format: ['{timestamp}', '{level}', '{logger}', '{message}', '{data}']
 * });
 *
 * // Multi-line text output
 * formatter.init({
 *   format: [
 *     '{timestamp} {LEVEL} [{logger}] {message}',
 *     'Context: {context}',
 *     'Data: {data}'
 *   ]
 * });
 * ```
 */
class DefaultFormatter implements Formatter {
  public name = NAME;
  public version = VERSION;
  public kind = KIND;

  private _config!: DefaultFormatterConfig;
  private _format!: string[][];
  private _timestampFormat: string = DEFAULT_TIMESTAMP_FORMAT;
  private _levelMap!: Record<string, string | [string, string]>;
  private _colorEnabled: boolean = false;

  // ANSI color codes for Node.js terminal output
  private _levelColorMap: Record<string, string> = {
    trace: '\x1b[37m', // White
    track: '\x1b[38;5;208m', // Orange
    debug: '\x1b[90m', // Grey
    info: '\x1b[34m', // Blue
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    fatal: '\x1b[41m', // Red background
  };

  // CSS color styles for browser console output
  private _levelCssColorMap: Record<string, string> = {
    trace: 'color: #bbb;', // Light gray
    track: 'color: orange;',
    debug: 'color: grey;',
    info: 'color: blue;',
    warn: 'color: gold;',
    error: 'color: red;',
    fatal: 'background: red; color: white;',
  };

  public init(config: DefaultFormatterConfig): void {
    const isBrowser = LogM8Utils.isBrowser();

    this._config = Object.assign({}, config);
    this._colorEnabled = !!this._config.color;

    // Parse format templates into token/literal segments
    this._format = [];
    let formatConfig = (this._config.format ?? DEFAULT_FORMAT) as string[];
    if (typeof this._config.format === 'string') formatConfig = [this._config.format];

    if (formatConfig) {
      for (const f of formatConfig) {
        // Split format string preserving both tokens ({...}) and literal text
        const regex = /(\{[^}]+\})|([^{}]+)/g;
        const parts = [];
        let match;
        while ((match = regex.exec(f)) !== null) {
          if (match[1]) {
            parts.push(match[1]); // token
          } else if (match[2] !== undefined) {
            parts.push(match[2]); // literal (preserve all, including whitespace)
          }
        }
        this._format.push(parts);
      }
    }

    this._timestampFormat = this._config.timestampFormat ?? DEFAULT_TIMESTAMP_FORMAT;

    // Build level display map with padding and optional colorization
    const maxLevelLength = Math.max(
      ...Enum(LogLevel)
        .values()
        .map((l) => l.length),
    );

    this._levelMap = Enum(LogLevel)
      .values()
      .reduce(
        (acc, level) => {
          let levelStr = level.toUpperCase().padEnd(maxLevelLength, ' ');
          if (this._colorEnabled) {
            if (isBrowser) {
              // Browser: return [text, cssStyle] array for console.log('%c...', style)
              const css = this._levelCssColorMap[level] || '';
              acc[level] = [`%c${levelStr}`, css];
              return acc;
            } else {
              // Node.js: wrap with ANSI escape codes
              const color = this._levelColorMap[level] || '';
              const reset = '\x1b[0m';
              levelStr = color + levelStr + reset;
            }
          }
          acc[level] = levelStr;
          return acc;
        },
        {} as Record<string, string | [string, string]>,
      );
  }

  public dispose(): void {}

  public format(logEvent: LogEvent): unknown[] {
    let output: unknown[] | undefined;

    const formatArr = this._format;
    if (formatArr.length > 0) {
      output = formatArr.map((item) => {
        if (item.length === 1) {
          return this.resolveToken(item[0], logEvent);
        }
        return item.reduce((str, part) => {
          const val = this.resolveToken(part, logEvent);
          return str + String(val);
        }, '');
      });
      // Locate data token and expand or remove it based on content
      const dataIndex = output.findIndex((v) => Array.isArray(v));
      if (dataIndex >= 0) {
        const data = output[dataIndex] as unknown[];
        if (data.length > 0) output.splice(dataIndex, 1, ...data);
        else output.splice(dataIndex, 1);
      }
    } else {
      output = [
        LogM8Utils.formatTimestamp(logEvent.timestamp, this._timestampFormat),
        logEvent.level,
        logEvent.logger,
        logEvent.message,
        ...logEvent.data,
        logEvent.context,
      ];
    }

    return output;
  }

  private resolveToken(part: string, logEvent: LogEvent): unknown {
    // Process tokens using curly brace syntax: {property.path}
    if (part.startsWith('{') && part.endsWith('}')) {
      const key = part.slice(1, -1);
      if (key === 'message' && typeof logEvent.message !== 'string') {
        return logEvent.message;
      } else if (key === 'LEVEL') {
        return this._levelMap[logEvent.level] ?? logEvent.level;
      } else if (key === 'timestamp') {
        const raw = LogM8Utils.getPropertyByPath(logEvent, key);
        return LogM8Utils.formatTimestamp(raw as Date, this._timestampFormat);
      }
      // Resolve data properties and context via dot-path notation
      return LogM8Utils.getPropertyByPath(logEvent, key);
    }
    // Return literal text unchanged
    return part;
  }
}

class DefaultFormatterFactory implements PluginFactory<DefaultFormatterConfig, DefaultFormatter> {
  public name = NAME;
  public version = VERSION;
  public kind = KIND;

  public create(config: DefaultFormatterConfig): DefaultFormatter {
    const appender = new DefaultFormatter();
    appender.init(config);
    return appender;
  }
}

export { DefaultFormatterFactory };
