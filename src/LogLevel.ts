import { Enum, type EnumType } from '@ncoderz/superenum';

/**
 * Enumeration of supported log levels, ordered by severity.
 * 'off' disables logging; 'fatal' through 'trace' represent increasing detail.
 * Includes 'track' for analytics-specific events.
 */
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

/**
 * Type of LogLevel
 */
export type LogLevelType = EnumType<typeof LogLevel>;

export { LogLevel };
