import { type Log } from './Log.ts';
import type { LogContext } from './LogContext.ts';
import type { LogLevelType } from './LogLevel.ts';

class NullLogger implements Log {
  fatal(_message: string, ..._args: unknown[]): void {
    // No operation
  }

  error(_message: string, ..._args: unknown[]): void {
    // No operation
  }

  warn(_message: string, ..._args: unknown[]): void {
    // No operation
  }

  info(_message: string, ..._args: unknown[]): void {
    // No operation
  }

  debug(_message: string, ..._args: unknown[]): void {
    // No operation
  }

  track(_message: string, ..._args: unknown[]): void {
    // No operation
  }

  trace(_message: string, ..._args: unknown[]): void {
    // No operation
  }

  readonly isFatal = false;
  readonly isError = false;
  readonly isWarn = false;
  readonly isInfo = false;
  readonly isDebug = false;
  readonly isTrack = false;
  readonly isTrace = false;

  readonly isEnabled = false;
  readonly name = 'nullLogger';
  readonly level = 'off';
  readonly context: LogContext = {};

  setLevel(_level: LogLevelType): void {
    // No operation
  }

  setContext(context: LogContext): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.context as any) = context;
  }

  getLogger(_name: string): Log {
    return this as unknown as Log; // Return self for any sub-logger
  }
}

export { NullLogger };
