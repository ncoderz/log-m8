import { Enum, type EnumType } from '@ncoderz/superenum';

/**
 * Enum defining the supported kinds of plugins: appenders, filters, and formatters.
 */
const PluginKind = Enum.fromArray([
  //
  'appender',
  'filter',
  'formatter',
] as const);

/**
 * Union type of all valid plugin kind values.
 */
export type PluginKindType = EnumType<typeof PluginKind>;

/**
 * The PluginKind enum instance containing all plugin categories.
 */
export { PluginKind };
