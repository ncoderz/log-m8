---
Title: Log-M8 Plugin System Specification
Version: 1.0.0
Date Created: 2025-08-10
Last Updated: 2025-08-10
---

## 1. Purpose

Define the plugin architecture of Log-M8: plugin kinds (appender, formatter, filter), plugin and factory interfaces, lifecycle management, and built-in plugin behaviors and configuration.

## 2. Scope & Context

### Will do:
- Describe plugin kinds, lifecycle, configuration, and factory registration
- Specify PluginManager behaviors and error conditions
- Specify built-in plugins: console appender, file appender, default text formatter, JSON formatter

### Will not do:
- Transport-specific or third-party appenders beyond console/file
- Data redaction policies (left to custom filters/formatters)

### Context:
- Used within Log-M8 manager initialization and runtime; no external processes required

## 3. Glossary

- Plugin: Component with name, version, kind, and lifecycle methods init/dispose
- Plugin Factory: Creates plugin instances by kind and config
- Plugin Manager: Registers factories, creates plugins, and disposes them
- Appender: Outputs formatted events
- Formatter: Converts LogEvent into output tokens
- Filter: Gates LogEvent emission

## 4. Core Features

1. Unique-name factory registration per plugin implementation
2. Creation of plugins by kind and name/config
3. Lifecycle management: init(config), dispose() — factories initialize created instances; Log-M8 may pass additional dependencies (formatter, filters) to appenders during init
4. Built-in plugins: console appender, file appender, default text formatter, JSON formatter
5. Appender priority ordering and filter chaining

## 5. User Stories

1. As a developer, I can register my custom appender factory so Log-M8 can create it from config.
2. As a developer, I can configure a formatter for an appender by name or inline config.
3. As a developer, I can add multiple filters to an appender to control log emission.

## 6. Functional Requirements

- FR-P-001: Factories must be registered with unique names; duplicate registration throws.
- FR-P-002: Creating a plugin requires a registered factory matching the given name and kind; otherwise throws.
- FR-P-003: Created plugin instances are tracked; dispose() is invoked during Log-M8 disposal.
- FR-P-004: Appender.init receives AppenderConfig, optional Formatter, and zero or more Filters. Factories initialize created plugin instances with the provided config; Log-M8 then calls Appender.init again to inject the resolved formatter and filters.
- FR-P-005: Appender.write must apply filters in order and skip on first false.
- FR-P-006: Appender priority determines execution order (descending numeric; default 0). Higher priority executes earlier.
- FR-P-007: Console appender uses console methods per level; file appender streams to file; default formatter supports text with tokenized templates and optional colors; JSON formatter provides structured JSON output and size guards.
- FR-P-008: Appenders declare supportedLevels; Log-M8 skips events whose level isn’t supported by a given appender.

## 7. Non-functional Requirements

- NFR-P-001: Plugin creation and dispatch shall be synchronous.
- NFR-P-002: Failures in a plugin shall not prevent other plugins from processing the same event.

## 8. Constraints & Assumptions

- C-P-001: Console appender requires global console; file appender requires Node fs and valid path.
- A-P-001: Custom plugins adhere to the defined interfaces and are registered before init().
- A-P-002: Appender.init may be called more than once (by factory and by Log-M8); appenders should tolerate repeated initialization without side effects.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8.plugins

// Kinds
enum PluginKind {
    APPENDER = "appender"
    FILTER = "filter"
    FORMATTER = "formatter"
}

// Base plugin shape
structure Plugin {
    @required name: String
    @required version: String
    @required kind: PluginKind
}

// Base config
// Note: Implementations may support additional fields; Smithy does not model index signatures.
structure PluginConfig {
    @required name: String
}

// References (name or inline config)
union FormatterRef { name: String, config: FormatterConfig }
union FilterRef { name: String, config: FilterConfig }
list FilterRefList { member: FilterRef }

// Appender configuration
structure AppenderConfig extends PluginConfig {
    enabled: Boolean
    priority: Integer
    formatter: FormatterRef
    filters: FilterRefList
}

// Formatter and Filter base configs
structure FormatterConfig extends PluginConfig {}
structure FilterConfig extends PluginConfig {}

// Built-in: Default Formatter (text)
structure DefaultFormatterConfig extends FormatterConfig {
    // String template or array of templates. Tokens: {timestamp}, {LEVEL}, {logger}, {message}, {data}, and nested fields via path.
    format: DefaultFormat
    // Timestamp format: e.g., "hh:mm:ss.SSS" or "iso"
    timestampFormat: String
    // Enable colorized level output (ANSI in Node, CSS in browser)
    color: Boolean
}
// Built-in: JSON Formatter
structure JsonFormatterConfig extends FormatterConfig {
    // Keys to include in output object; string or list
    format: JsonFormat
    // Timestamp format applied to the timestamp field
    timestampFormat: String
    // Pretty printing control; true => 2 spaces
    pretty: Pretty
    // Size guards passed to stringifyLog
    maxDepth: Integer
    maxStringLen: Integer
    maxArrayLen: Integer
}

union JsonFormat { single: String, multiple: JsonTemplateList }
list JsonTemplateList { member: String }
union Pretty { enabled: Boolean, spaces: Integer }

union DefaultFormat { single: String, multiple: DefaultTemplateList }
list DefaultTemplateList { member: String }

// Built-in: File Appender
structure FileAppenderConfig extends AppenderConfig {
    @required filename: String
    append: Boolean
}

// Notes:
// - Plugin instances are created internally during Log-M8.init(config).
// - Factories must be registered before init.
// - Factories initialize created instances with the provided config.
// - Log-M8 passes formatter/filters to appenders via a subsequent init call.
```

## 10. Error Handling

- Duplicate factory registration results in an Error being thrown with a descriptive message.
- Creating a plugin with a name/kind that does not match any registered factory throws an Error with a descriptive message.

## 11. User Interface

None.

## 12. Acceptance Criteria

- Registering two factories with the same name fails with an Error indicating duplicate registration.
- Creating plugins for each configured appender/formatter/filter succeeds when factories exist.
- Appender priority ordering is descending; filters short-circuit correctly.

## References

- Root spec: [/spec/spec.md](/spec/spec.md)
- Code: `src/Plugin.ts`, `src/PluginFactory.ts`, `src/PluginManager.ts`, `src/PluginKind.ts`
- Built-ins: `src/appenders/ConsoleAppender.ts`, `src/appenders/FileAppender.ts`, `src/formatters/DefaultFormatter.ts`, `src/formatters/JsonFormatter.ts`
- Built-in Appenders Specs: Console [/spec/spec-appenders-console.md](/spec/spec-appenders-console.md), File [/spec/spec-appenders-file.md](/spec/spec-appenders-file.md)
- Default Formatter Spec: [/spec/spec-formatter-default.md](/spec/spec-formatter-default.md)
- Filters Spec: [/spec/spec-filters.md](/spec/spec-filters.md)
- MatchFilter Spec: [/spec/spec-filters-match.md](/spec/spec-filters-match.md)
