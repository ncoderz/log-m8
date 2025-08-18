import type { WriteStream } from 'fs';
import { createWriteStream } from 'fs';

import type { Appender } from '../Appender.ts';
import type { AppenderConfig } from '../AppenderConfig.ts';
import type { Filter } from '../Filter.ts';
import type { Formatter } from '../Formatter.ts';
import type { LogEvent } from '../LogEvent.ts';
import { LogLevel, type LogLevelType } from '../LogLevel.ts';
import { LogM8Utils } from '../LogM8Utils.ts';
import type { PluginFactory } from '../PluginFactory.ts';
import { PluginKind } from '../PluginKind.ts';

const NAME = 'file';
const VERSION = '1.0.0';
const KIND = PluginKind.appender;

const DEFAULT_FILENAME = 'app.log';

const SUPPORTED_LEVELS = new Set<LogLevelType>([
  LogLevel.fatal,
  LogLevel.error,
  LogLevel.warn,
  LogLevel.info,
  LogLevel.debug,
  LogLevel.track,
  LogLevel.trace,
]);

/**
 * Configuration options for the file appender.
 *
 * - filename: Destination file path. The file is opened on init.
 * - append:   When true, appends to the existing file; otherwise it is truncated.
 */
export interface FileAppenderConfig extends AppenderConfig {
  /** Destination file path to write logs into. */
  filename: string;
  /** Append to existing file (true) or overwrite on startup (false). Default: false */
  append?: boolean;
}

/**
 * Appender that writes each formatted log event to a file (one line per event).
 *
 * Behavior
 * - Initializes a WriteStream on init() using the provided filename.
 * - Joins formatted tokens with a single space and appends a trailing newline.
 * - If no formatter is configured, writes the raw LogEvent via String() coercion of tokens.
 * - Respects per-appender filters before writing.
 * - flush() is a no-op; data is flushed by the stream implementation. dispose() ends the stream.
 */
class FileAppender implements Appender {
  public name = NAME;
  public version = VERSION;
  public kind = KIND;

  public readonly supportedLevels = SUPPORTED_LEVELS;
  public enabled = true;
  public priority?: number;

  private _config?: FileAppenderConfig;
  private _formatter?: Formatter;
  private _filters: Filter[] = [];
  private _stream?: WriteStream;

  public init(config: AppenderConfig, formatter?: Formatter, filters?: Filter[]): void {
    this._config = config as FileAppenderConfig;
    this._formatter = formatter;
    this._filters = filters || [];
    const flags = this._config.append ? 'a' : 'w';
    this._stream = createWriteStream(this._config.filename ?? DEFAULT_FILENAME, { flags });

    this.enabled = this._config?.enabled !== false; // Default to true if not specified
    this.priority = this._config?.priority;
  }

  public dispose(): void {
    this._stream?.end();
  }

  public write(event: LogEvent): void {
    if (!this._stream) return;

    // Filter
    for (const filter of this._filters) {
      if (filter.enabled && !filter.filter(event)) {
        return; // Skip if any filter denies logging
      }
    }

    // Format
    const data = this._formatter ? this._formatter.format(event) : [event];

    // Log
    const message = data
      .map((d) => {
        if (LogM8Utils.isString(d)) return d;
        return String(d);
      })
      .join(' ');
    this._stream.write(message + '\n');
  }

  public flush(): void {
    // No-op for file appender; data is flushed on stream end.
  }

  public enableFilter(name: string): void {
    const filter = this._getFilter(name);
    if (!filter) return;
    filter.enabled = true;
  }

  public disableFilter(name: string): void {
    const filter = this._getFilter(name);
    if (!filter) return;
    filter.enabled = false;
  }

  private _getFilter(name: string): Filter | undefined {
    return this._filters.find((f) => f.name === name);
  }
}

class FileAppenderFactory implements PluginFactory<FileAppenderConfig, FileAppender> {
  public name = NAME;
  public version = VERSION;
  public kind = KIND;

  public create(config: AppenderConfig): FileAppender {
    const appender = new FileAppender();
    appender.init(config);
    return appender;
  }
}

export { FileAppender, FileAppenderFactory };
