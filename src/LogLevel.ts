import { Enum, type EnumType } from '@ncoderz/superenum';

/**
 * Enumeration of supported log severity levels in ascending order of verbosity.
 *
 * The logging system uses this hierarchy to determine which events to emit:
 * - 'off': Disables all logging
 * - 'fatal': Critical system failures requiring immediate intervention
 * - 'error': Failures preventing normal operation
 * - 'warn': Potentially problematic situations
 * - 'info': General informational messages about normal operation
 * - 'debug': Detailed diagnostic information for development
 * - 'track': Analytics and user behavior tracking events
 * - 'trace': Most detailed execution information for fine-grained debugging
 *
 * Events are emitted when their level index is <= logger's level index.
 * The 'track' level is positioned between 'debug' and 'trace' to allow
 * analytics collection without the verbosity of full trace logging.
 *
 * @example
 * ```typescript
 * // Logger set to 'info' will emit: fatal, error, warn, info
 * logger.setLevel('info');
 * logger.debug('Not emitted'); // debug > info in hierarchy
 * logger.info('Emitted');      // info <= info in hierarchy
 * ```
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
 * Type representing a LogLevel enum value.
 */
export type LogLevelType = EnumType<typeof LogLevel>;

export { LogLevel };
