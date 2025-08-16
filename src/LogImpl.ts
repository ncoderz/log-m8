import type { LogLevelType } from './index.ts';
import type { Log } from './Log.ts';
import type { LogContext } from './LogContext.ts';

export interface LogImpl extends Log {
  isEnabled: boolean;

  isFatal: boolean;
  isError: boolean;
  isWarn: boolean;
  isInfo: boolean;
  isDebug: boolean;
  isTrack: boolean;
  isTrace: boolean;

  name: string;
  level: LogLevelType;
  context: LogContext;

  _levelNumber: number;
}
