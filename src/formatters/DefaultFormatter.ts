import { Enum } from '@ncoderz/superenum';

import type { Formatter } from '../Formatter.ts';
import type { FormatterConfig } from '../FormatterConfig.ts';
import type { LogEvent } from '../LogEvent.ts';
import { LogLevel } from '../LogLevel.ts';
import { LogM8Utils } from '../LogM8Utils.ts';
import { PluginKind } from '../PluginKind.ts';

const DEFAULT_FORMAT = ['{timestamp} [{LEVEL}] ({logger}) {message}', '{data}'];
const DEFAULT_TIMESTAMP_FORMAT = 'hh:mm:ss.SSS';

export interface DefaultFormatterConfig extends FormatterConfig {
  format?: string | string[];
  timestampFormat?: string;
}

const FORMAT_REGEX = /^\{(.+?)\}$/;

class DefaultFormatter implements Formatter {
  public name = 'default';
  public version = '1.0.0';
  public kind = PluginKind.formatter;

  private _config!: DefaultFormatterConfig;
  private _format!: string[][];
  private _timestampFormat: string = DEFAULT_TIMESTAMP_FORMAT;
  private _levelMap!: Record<string, string>;

  public init(config: DefaultFormatterConfig): void {
    this._config = Object.assign({}, config);

    // Support format as a string: split into array using {} tokens
    this._format = [];
    let formatConfig = (this._config.format ?? DEFAULT_FORMAT) as string[];
    if (typeof this._config.format === 'string') formatConfig = [this._config.format];

    if (formatConfig) {
      for (const f of formatConfig) {
        // Split by curly braces, keeping tokens and literals (including whitespace and symbols)
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

    // Build the level map for quick access
    const maxLevelLength = Math.max(
      ...Enum(LogLevel)
        .values()
        .map((l) => l.length),
    );
    this._levelMap = Enum(LogLevel)
      .values()
      .reduce(
        (acc, level) => {
          acc[level] = level.toUpperCase().padEnd(maxLevelLength, ' ');
          return acc;
        },
        {} as Record<string, string>,
      );
  }

  public dispose(): void {
    // No resources to dispose for console appender
  }

  public format(logEvent: LogEvent): unknown[] {
    const formatArr = this._format;
    if (formatArr.length > 0) {
      let dataIndex = -1;
      const output = formatArr.map((item, idx) => {
        const singleItem = item.length === 1;
        let partStr = '';
        for (const part of item) {
          const match = FORMAT_REGEX.exec(part);
          if (match) {
            const key = match[1];
            let value = LogM8Utils.getPropertyByPath(logEvent, match[1]);
            // Special handling for level
            if (key === 'LEVEL') {
              value = this._levelMap[logEvent.level] ?? logEvent.level;
            }
            // Special handling for timestamp
            else if (key === 'timestamp') {
              value = LogM8Utils.formatTimestamp(value as Date, this._timestampFormat);
            }
            // Special handling for data
            else if (singleItem && key === 'data') {
              dataIndex = idx;
            }
            if (singleItem) return value;
            partStr += String(value);
          } else {
            // Literal string
            partStr += part;
          }
        }

        return partStr;
      });

      // Expand the data array
      if (dataIndex >= 0) {
        const data = output[dataIndex] as unknown[];
        if (data.length > 0) {
          // Spread the data into the output
          output.splice(dataIndex, 1, ...data);
        } else {
          // Remove the data part if no data
          output.splice(dataIndex, 1);
        }
      }

      return output;
    }
    // Default output if no format array
    return [
      LogM8Utils.formatTimestamp(logEvent.timestamp, this._timestampFormat),
      logEvent.level,
      logEvent.logger,
      logEvent.message,
      ...logEvent.data,
      logEvent.context ? JSON.stringify(logEvent.context) : undefined,
    ];
  }
}

export { DefaultFormatter };
