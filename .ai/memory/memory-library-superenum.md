# Library: @ncoderz/superenum

- Version: ^1.0.0 (from package.json)
- Purpose: Type-safe string enums with runtime helpers (values, parsing).
- Locations:
  - src/LogLevel.ts (enum definition, EnumType)
  - src/PluginKind.ts (enum definition, EnumType)
  - src/LogM8.ts (values() for ordering; fromValue() for config parsing)
  - src/formatters/DefaultFormatter.ts (values() for formatting logic)
  - tests: test/unit/filter.test.ts and others (fromValue usage)
- APIs used: Enum.fromArray, Enum(EnumObj).values(), Enum(EnumObj).fromValue, EnumType<typeof EnumObj>
- Notes:
  - fromValue may return undefined; code uses fallbacks (e.g., LogLevel.info)
  - Ordering depends on the array passed to fromArray; affects precedence checks.
