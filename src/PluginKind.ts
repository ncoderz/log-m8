import { Enum, type EnumType } from '@ncoderz/superenum';

const PluginKind = Enum.fromArray([
  //
  'appender',
  'filter',
  'formatter',
] as const);

export type PluginKindType = EnumType<typeof PluginKind>;

export { PluginKind };
