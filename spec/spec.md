---
Title: Log-M8 Logging Library Specification
Version: 1.0.0
Date Created: 2025-- FR-007: Logger setLevel(level) shall set the logger's level and computed internal index, accepting LogLevelType enum values.8-10
Last Updated: 2025-08-10
---

## 1. Purpose

Log-M8 is a lightweight, extensible logging library for TypeScript/JavaScript applications. It provides hierarchical loggers, configurable log levels, buffered startup logging, and a plugin system for appenders, formatters, and filters. It ships with a console appender, file appender (Node.js), and a default formatter supporting colored/text and JSON output with rich timestamp formatting.

## 2. Scope & Context

### What the system will do:
- Provide a global logging manager you can initialize, dispose, and query for named loggers
- Support hierarchical loggers using dot-separated names
- Support log levels: off, fatal, error, warn, info, debug, track, trace
- Buffer log events emitted before initialization (up to 100), then flush them upon init
- Dispatch log events to configured appenders in priority order
- Allow enabling/disabling and flushing of appenders at runtime
- Allow custom plugins (appenders, formatters, filters) via a simple factory interface
- Include built-in plugins: console appender, file appender (Node.js), default formatter
- Provide timestamp formatting utilities and path-based property access for formatters

### What the system will not do:
- Provide network transport, remote log shipping, or rotation/retention management
- Provide persistence beyond the file appender’s write stream
- Provide asynchronous retry or backpressure management for appenders
- Provide structured schema validation of plugin configs (beyond basic shape)
- Provide redaction or PII detection out of the box

### System Context:
- Runs in Node.js and browser environments
  - Console appender works in both (requires global console)
  - File appender requires Node.js fs module
- Integrates into application code as a library; no server or external service required

## 3. Glossary

- Logger: A named entity used to emit log events at various levels.
- Log Level: Severity level controlling which events are emitted (off, fatal, error, warn, info, debug, track, trace).
- Log Event: The structured representation of a single log entry (logger, level, message, data, context, timestamp).
- Appender: Plugin that outputs formatted log events to a destination (console, file, etc.).
- Formatter: Plugin that converts a Log Event into output tokens (strings/objects) for appenders.
- Filter: Plugin that decides whether a Log Event should be logged.
- Plugin: A component with name/version/kind and lifecycle methods (init/dispose).
- Plugin Factory: A factory that creates plugins by name and kind.
- Plugin Kind: One of appender, formatter, filter.
- Logging Config: Initialization configuration defining default level, per-logger levels, and appenders.

## 4. Core Features

1. Initialization & teardown (init/dispose) with buffered pre-init logging
2. Hierarchical loggers ("a.b.c") with per-logger level overrides
3. Rich levels including track for analytics
4. Plugin system with built-in console/file appenders and default formatter
5. Formatter with template tokens, JSON mode, and timestamp formatting
6. Runtime control of appenders (enable/disable/flush; flush all)
7. Deterministic appender execution order via priority
8. Utilities for timestamp formatting and object path resolution

## 5. User Stories

1. As a developer, I can initialize logging with default and per-logger levels so I can control verbosity.
2. As a developer, I can get hierarchical child loggers so I can organize logs by subsystem.
3. As a developer, I can emit logs at fatal/error/warn/info/debug/track/trace levels.
4. As a developer, I can configure console and file outputs and customize formats (text/JSON, colors, timestamps).
5. As a developer, I can add custom appenders/formatters/filters via plugin factories.
6. As a developer, I can enable/disable and flush appenders at runtime for maintenance or troubleshooting.
7. As a developer, logs emitted before init are buffered (up to 100) and flushed on init so I don’t lose early logs.

## 6. Functional Requirements

### 6.1 Initialization & Lifecycle
- FR-001: The library shall expose a logging manager (singleton export) and a class to construct managers.
- FR-002: init(config) shall set default level, per-logger levels, and configure appenders with optional formatter and filters.
- FR-003: dispose() shall flush all appenders, clear loggers/appenders, dispose created plugins, clear factories, and disable further logging until re-init.
- FR-004: Prior to init, up to 100 log events shall be buffered; upon first log after init, the buffer shall be flushed in FIFO order before the triggering event.

### 6.2 Loggers & Levels
- FR-005: getLogger(name|string[]) shall return a logger with name either the given string or dot-joined segments; repeated calls return the same instance.
- FR-006: Logger methods fatal/error/warn/info/debug/track/trace(message, ...data) shall emit events at the respective level.
- FR-007: Logger setLevel(level) shall set the logger’s level and computed internal index.
- FR-008: Logger setContext(ctx) shall replace the logger’s context with the provided object.
- FR-009: Logger getLogger(childName) shall return a child logger named parent.child.
- FR-010: Log enablement rule: a log is emitted only if levelIndex <= logger.levelIndex where index order is [off, fatal, error, warn, info, debug, track, trace].
- FR-011: Logger read-only flags (isFatal, isError, isWarn, isInfo, isDebug, isTrack, isTrace) indicate enablement for that severity level and higher severity levels (i.e., whether calling that log method would emit an event).
- FR-011a: Logger read-only flag isEnabled indicates whether logging is active (false only when level is 'off').

### 6.3 Appenders
- FR-012: Appenders shall declare supportedLevels; events outside this set are skipped.
- FR-013: Appenders shall be initialized with AppenderConfig, optional Formatter, and zero or more Filters.
- FR-014: The manager shall call appender.write(event) for each event that passes filters; errors during write shall be caught and logged to console.
- FR-015: enableAppender(name) and disableAppender(name) shall toggle an appender’s enabled flag.
- FR-016: flushAppender(name) and flushAppenders() shall call appender.flush() catching errors.
- FR-017: Appenders shall be executed in order of descending priority (higher numbers first). If unspecified, priority is treated as 0.

### 6.4 Plugins & Factories
- FR-018: A PluginFactory shall be registered per plugin implementation; name must be unique.
- FR-019: Creating a plugin by kind and name shall use the matching factory; if none is found, an error shall be thrown.
- FR-020: During init, appender/formatter/filter instances shall be created via factories; plugin instances are tracked for later disposal.
- FR-021: dispose() shall call dispose() on all created plugin instances and clear the tracking.

### 6.5 Built-in Plugins
- FR-022: Console Appender (name: "console"): outputs to global console; supports all levels except off; no-op flush; enabled by default unless disabled in config.
- FR-023: File Appender (name: "file"): writes lines to a given filename; supports append or overwrite; Node.js only.
- FR-024: Default Formatter (name: "default"): supports text and JSON output, optional colorization (ANSI in Node, CSS in browser), and tokenized templates.

### 6.6 Formatting & Tokens
- FR-025: Default text format default: "{timestamp} {LEVEL} [{logger}] {message}", then a second token line "{data}" expanded/removed based on presence.
- FR-026: Default JSON format fields: ["{timestamp}", "{level}", "{logger}", "{message}", "{data}"] producing a single object.
- FR-027: Timestamp format default is "hh:mm:ss.SSS" for text and "iso" for JSON; format strings support tokens: yyyy, yy, MM, dd, hh, h, mm, ss, SSS, SS, S, A, a, z, zz.
- FR-028: Token resolution looks up fields on the Log Event via dot-paths; LEVEL renders uppercased level with optional colorization in text mode; timestamp uses the timestamp formatter.

### 6.7 Filtering
- FR-029: Filters shall be called in order for each event; if any filter returns false, the event is skipped.
- FR-030: Missing filters or formatter are optional; events shall be passed as a single LogEvent object when no formatter is provided.

## 7. Non-functional Requirements

### 7.1 Usability
- NFR-001: Zero-config startup shall produce visible console logs with sensible defaults.
- NFR-002: Library API shall be discoverable via TypeScript types.

### 7.2 Compatibility
- NFR-003: Support Node.js (file + console) and modern browsers (console).
- NFR-004: File appender requires Node.js fs module and a writeable filesystem path.

### 7.3 Performance & Capacity
- NFR-005: Logging call overhead for disabled levels should be O(1) with minimal allocations.
- NFR-006: Buffer capacity prior to init is capped at 100 events; oldest dropped when full.
- NFR-007: Appender invocation is synchronous and sequential in priority order.

### 7.4 Reliability & Availability
- NFR-008: Failures in a single appender should not prevent other appenders from running for the same event.
- NFR-009: dispose() shall make a best effort to flush/close resources (e.g., file streams).

### 7.5 Security & Privacy
- NFR-010: Library shall not exfiltrate data; all outputs are local (console/file) unless custom appenders are added by users.
- NFR-011: Sensitive data handling/redaction is the responsibility of application code or custom filters/formatters.

### 7.6 Compliance
- NFR-012: No special compliance requirements; usage in regulated contexts must add appropriate filters/redaction.

## 8. Constraints & Assumptions

### 8.1 Constraints
- C-001: Appender priority execution order is descending (higher numbers first). This is the implemented behavior.
- C-002: Logger boolean flags (isFatal, etc.) indicate enablement for that severity level and higher severity levels; when true, calling that log method will emit an event.
- C-003: If a requested plugin factory (by name/kind) is not found during init, initialization throws.
- C-004: Console availability is required for console appender; file appender requires fs availability.

### 8.2 Assumptions
- A-001: Applications will call init() early in startup; pre-init buffer protects against early logs but should be kept small.
- A-002: Applications may register additional plugin factories before calling init().
- A-003: Logger boolean flags (isFatal, etc.) indicate enablement for that severity level and higher severity levels; when true, calling that log method will emit an event.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8

// Library API modeled as an abstract service to describe code-level interactions.
// No network protocol implied.

// ===== Enums =====

enum LogLevel {
    OFF = "off"
    FATAL = "fatal"
    ERROR = "error"
    WARN = "warn"
    INFO = "info"
    DEBUG = "debug"
    TRACK = "track"
    TRACE = "trace"
}

enum PluginKind {
    APPENDER = "appender"
    FILTER = "filter"
    FORMATTER = "formatter"
}

// ===== Structures =====

structure LogContext {
    // Arbitrary key-values supported via document map
    entries: ContextMap
    userId: String
    requestId: String
    correlationId: String
}

map ContextMap {
    key: String
    value: Document
}

structure LogEvent {
    @required
    logger: String

    @required
    level: LogLevel

    @required
    // Message string or any serializable object
    message: Document

    // Additional variadic data items
    data: DataList

    @required
    context: LogContext

    @required
    timestamp: Timestamp
}

list DataList {
    member: Document
}

// Base config for any plugin
structure PluginConfig {
    @required
    name: String

    // Additional plugin-specific options
    options: Document
}

// Formatter config
structure FormatterConfig extends PluginConfig {}

// Filter config
structure FilterConfig extends PluginConfig {}

// Appender config
structure AppenderConfig extends PluginConfig {
    enabled: Boolean
    priority: Integer
    // Formatter can be referred to by name or inline config
    formatterName: String
    formatterConfig: FormatterConfig
    // Filters by name or inline configs
    filterNames: FilterNameList
    filterConfigs: FilterConfigList
}

list FilterNameList { member: String }
list FilterConfigList { member: FilterConfig }

structure LoggingConfig {
    level: LogLevel
    // Per-logger level overrides (by name)
    loggerLevels: LoggerLevelMap
    // Appender configs
    appenders: AppenderConfigList
}

map LoggerLevelMap {
    key: String
    value: LogLevel
}

list AppenderConfigList { member: AppenderConfig }

// Default formatter configuration
structure DefaultFormatterConfig extends FormatterConfig {
    // Either a single template string or multiple segments
    // e.g., "{timestamp} {LEVEL} [{logger}] {message}"
    format: FormatTemplates
    // Timestamp formatting: "iso", "locale", or tokenized pattern (yyyy, yy, MM, dd, hh, h, mm, ss, SSS, SS, S, A, a, z, zz)
    timestampFormat: String
    // Enable color (ANSI on Node, CSS on browser)
    color: Boolean
    // JSON mode outputs a single object instead of text tokens
    json: Boolean
}

// For convenience in modeling a union of string | string[]
list TemplateList { member: String }
union FormatTemplates {
    single: String
    multiple: TemplateList
}

// File appender configuration
structure FileAppenderConfig extends AppenderConfig {
    @required
    filename: String
    append: Boolean
}

// ===== Service and Operations =====

@title("Log-M8 Library")
service LogM8Library {
    version: "1.0.0"
    operations: [
        InitLogging,
        DisposeLogging,
        GetLogger,
        EnableAppender,
        DisableAppender,
        FlushAppender,
        FlushAppenders,
        RegisterPluginFactory,

        // Logger operations (modeled resource-like)
        LoggerSetLevel,
        LoggerSetContext,
        LoggerGetChild,
        LoggerFatal,
        LoggerError,
        LoggerWarn,
        LoggerInfo,
        LoggerDebug,
        LoggerTrack,
        LoggerTrace
    ]
}

// Initialization
operation InitLogging {
    input: InitLoggingInput
    output: InitLoggingOutput
    errors: [PluginFactoryNotFound]
}

structure InitLoggingInput {
    config: LoggingConfig
}

structure InitLoggingOutput {
    success: Boolean
}

// Tear down
operation DisposeLogging {
    output: DisposeLoggingOutput
}

structure DisposeLoggingOutput { success: Boolean }

// Access or create a logger by name
operation GetLogger {
    input: GetLoggerInput
    output: GetLoggerOutput
}

structure GetLoggerInput {
    @required
    name: String
}

structure GetLoggerOutput {
    @required
    name: String
    // Current level
    level: LogLevel
}

// Appender controls
operation EnableAppender { input: AppenderByName }
operation DisableAppender { input: AppenderByName }
operation FlushAppender { input: AppenderByName }
operation FlushAppenders {}

structure AppenderByName { @required name: String }

// Plugin registration
operation RegisterPluginFactory {
    input: RegisterPluginFactoryInput
    errors: [DuplicateFactory]
}

structure RegisterPluginFactoryInput {
    @required
    factoryName: String
    @required
    version: String
    @required
    kind: PluginKind
}

// Logger operations
operation LoggerSetLevel { input: LoggerSetLevelInput }
structure LoggerSetLevelInput { @required name: String, @required level: LogLevel }

operation LoggerSetContext { input: LoggerSetContextInput }
structure LoggerSetContextInput { @required name: String, context: LogContext }

operation LoggerGetChild { input: LoggerGetChildInput, output: GetLoggerOutput }
structure LoggerGetChildInput { @required parent: String, @required child: String }

// Emission operations (modeled; actual library calls are synchronous void)
operation LoggerFatal { input: EmitInput }
operation LoggerError { input: EmitInput }
operation LoggerWarn { input: EmitInput }
operation LoggerInfo { input: EmitInput }
operation LoggerDebug { input: EmitInput }
operation LoggerTrack { input: EmitInput }
operation LoggerTrace { input: EmitInput }

structure EmitInput {
    @required
    name: String
    @required
    message: Document
    data: DataList
}

// ===== Errors =====

@error("client")
structure PluginFactoryNotFound { message: String }

@error("client")
structure DuplicateFactory { message: String }

// Implementation notes (Smithy comments):
// - Events logged before init() are buffered up to 100 and flushed on first post-init log emission.
// - Appenders execute in descending priority order. Missing/undefined priority treated as 0.
// - Console appender requires global console; file appender requires Node.js fs and a valid path.
// - Formatter tokens include {timestamp}, {LEVEL}, {level}, {logger}, {message}, {data}, and nested fields via dot-paths.
// - Logger boolean flags (isFatal/isError/...) indicate enablement for that severity level and higher severity levels.
```

## 10. Error Handling

### General Rules:
1. Library methods are synchronous; errors are thrown for unrecoverable conditions (e.g., missing plugin factory).
2. Appender write/flush errors are caught per appender; they are logged to console and do not stop other appenders.
3. Initialization with invalid appender/filter/formatter names throws.
4. File appender I/O errors may occur during init (stream creation) or write; these are not retried.

### Error Conditions:
- PluginFactoryNotFound: Attempted to create a plugin by name/kind without a registered factory.
- DuplicateFactory: Attempted to register a plugin factory with a name already registered.
- ConsoleUnavailable: Console not available in environment (console appender cannot operate).
- FileOpenError: File path not writeable or fs unavailable (file appender cannot operate).

## 11. User Interface

This library provides no user interface.

## 12. Acceptance Criteria

### Test Categories
- Unit: LogM8 manager, logger behavior, buffering, plugin management
- Integration: Console/file appenders with formatter and filtering
- Non-functional: Performance of disabled logs, error resilience across appenders

### Acceptance Criteria Matrix
- Init/dispose cycles function without resource leaks (streams closed, plugins disposed)
- getLogger returns stable instances and supports parent.child names
- Level gating matches the specified order; enablement-based flags behave as documented
- Default console and file appenders work with default formatter text and JSON modes
- Appender priority ordering is descending; enabling/disabling works at runtime
- Buffering of pre-init logs caps at 100 and flushes correctly
- Missing plugin factories throw at init; write/flush errors in appenders do not crash process

## References

- Plugin System: [/spec/spec-plugins.md](/spec/spec-plugins.md)
- Filters: [/spec/spec-filters.md](/spec/spec-filters.md)
- Built-in Appenders: Console [/spec/spec-appenders-console.md](/spec/spec-appenders-console.md), File [/spec/spec-appenders-file.md](/spec/spec-appenders-file.md)
- Default Formatter: [/spec/spec-formatter-default.md](/spec/spec-formatter-default.md)
- Project source types: `src/index.ts`, `src/LogM8.ts`, `src/Log.ts`, `src/LogEvent.ts`, `src/LoggingConfig.ts`, `src/appenders/*`, `src/formatters/*`
- Utilities: `src/LogM8Utils.ts`
