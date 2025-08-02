import { Enum, type EnumType } from '@ncoderz/superenum';

const LogLevel = Enum.fromArray([
  'off', // No logging

  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'track', // Special log level for analytics
  'trace',
] as const);

export type LogLevelType = EnumType<typeof LogLevel>;

export { LogLevel };
