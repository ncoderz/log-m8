import { Enum, type EnumType } from '@ncoderz/superenum';

/**
 * Enumeration of plugin types supported by the LogM8 plugin system.
 *
 * The logging system uses a plugin architecture where functionality is
 * provided by three categories of plugins:
 *
 * - **appender**: Output destinations that write formatted log events
 * - **filter**: Event processors that determine which events to log
 * - **formatter**: Event transformers that convert LogEvent objects to output format
 *
 * Each plugin factory must declare its kind to enable proper registration
 * and instantiation during system initialization.
 *
 * @example
 * ```typescript
 * class CustomAppender implements Appender {
 *   kind = PluginKind.appender;
 *   // ... implementation
 * }
 *
 * class CustomFilter implements Filter {
 *   kind = PluginKind.filter;
 *   // ... implementation
 * }
 * ```
 */
const PluginKind = Enum.fromArray([
  'appender', // Log output destinations (console, file, network, etc.)
  'filter', // Event filtering logic (level, content, rate limiting, etc.)
  'formatter', // Event formatting (text, JSON, custom templates, etc.)
] as const);

/**
 * Type representing a PluginKind enum value.
 */
export type PluginKindType = EnumType<typeof PluginKind>;

export { PluginKind };
