---
Title: LogM8 Logging Library Specification
Version: 1.0.0
Date Created: 2025-08-16
Last Updated: 2025-08-16
---

# LogM8 Logging Library

## 1. Purpose

LogM8 is a pluggable, hierarchical logging library for TypeScript/JavaScript applications. It provides level-based logging APIs, a small core, and an extensible plugin architecture for appenders (destinations), formatters (rendering), and filters (selection). It targets both Node.js and browser environments with zero-config defaults and safe, predictable behavior under load.

## 2. Scope & Context

### What the system will do
- Provide hierarchical loggers with dot-separated names and per-logger levels.
- Support log levels: off, fatal, error, warn, info, debug, track, trace (in verbosity order low→high).
- Buffer pre-init logs and flush them once initialized.
- Route events through optional global and appender-level filters.
- Transform events via formatters to structured output tokens.
- Deliver output to destinations via appenders (console, file, custom).
- Allow runtime control to enable/disable appenders and filters and to flush.
- Offer utilities for timestamp formatting and safe JSON stringification of complex objects and errors.
- Support custom plugins via a typed factory system.

### What the system will not do
- Provide network transport appenders out-of-the-box (may be added via plugins).
- Persist logs reliably across process crashes (file appender uses OS buffering; no journaling).
- Perform PII redaction automatically (can be implemented via filters).
- Provide a UI; it is a code library.

### System context
- Consumers: Node.js services/CLIs, browser apps, libraries.
- Dependencies: @ncoderz/superenum; Node.js fs module for file appender.
- Environment: Node >= 18 (supported, tested with Node 24); browser support for console output only.

## 3. Glossary
- Logger: A named logging interface (e.g., "app.db") with level and context.
- Log Event: Structured data emitted by a logger: { logger, level, message, data[], context, timestamp }.
- Level: One of off | fatal | error | warn | info | debug | track | trace.
- Appender: Output destination plugin that writes events (e.g., console, file).
- Formatter: Plugin that converts a Log Event to output tokens (strings/values).
- Filter: Plugin that decides whether an event should be logged.
- Plugin Factory: A factory that creates instances of a specific plugin kind.
- Plugin Kind: One of appender | filter | formatter.
- Tokens: Placeholders used by formatters to interpolate event data.

## 4. Core Features
1. Hierarchical loggers with per-logger level overrides and shared context.
2. Pre-init buffering (up to a capped size) with FIFO flush post-init.
3. Plugin architecture with built-in factories:
   - Appenders: console, file
   - Formatters: default-formatter (text), json-formatter (JSON)
   - Filters: match-filter (allow/deny rules)
4. Level-based O(1) gating for disabled logs.
5. Runtime control to enable/disable appenders/filters and flush appenders.
6. Flexible timestamp formatting (presets and tokens).
7. Safe JSON stringification with depth/length limits and robust Error serialization.

## 5. User Stories
1. As an app developer, I can initialize logging with a configuration so that logs go to desired destinations with desired formatting.
2. As a developer, I can get a logger by name and emit logs at different levels with structured data.
3. As a developer, I can set per-logger levels and context and create child loggers using hierarchical names.
4. As an operator, I can enable/disable an appender and enable/disable a filter (globally or per appender) at runtime.
5. As a library author, I can register custom appender/formatter/filter factories to extend the system.
6. As a developer, I can choose JSON or text output, control timestamps, and optionally colorize levels in console.
7. As a developer, I can filter logs declaratively by matching event fields or context.

## 6. Functional Requirements

### 6.1 Initialization & Lifecycle
- FR-001: System shall provide an initialization function that accepts a configuration object (LoggingConfig) and configures default level, per-logger levels, appenders, formatters, and filters.
- FR-002: System shall buffer log events emitted before initialization and flush them in FIFO order on the first log processed after initialization completes.
- FR-003: System shall provide a dispose function that flushes appenders, disposes all plugins, clears loggers, clears buffers, and deregisters plugin factories.

### 6.2 Logger Management
- FR-010: System shall provide getLogger(name) supporting string or string[] names; array names are joined by '.' into hierarchical names.
- FR-011: Logger shall expose methods: fatal, error, warn, info, debug, track, trace to emit events.
- FR-012: Logger shall expose level-derived booleans: isEnabled, isFatal, isError, isWarn, isInfo, isDebug, isTrack, isTrace for fast feature tests.
- FR-013: Logger shall provide setLevel(level) to update the logger's threshold.
- FR-014: Logger shall provide setContext(context) to set the context object attached to emitted events.
- FR-015: Logger shall provide getLogger(childName) to return a child logger named `${parent}.${child}`.

### 6.3 Event Emission & Structure
- FR-020: A log event shall include: logger (string), level (LogLevel), message (string|unknown), data (unknown[]), context (object), timestamp (Date).
- FR-021: When the logger level disables the given event level, the call shall be a no-op without allocations beyond argument evaluation.

### 6.4 Filtering
- FR-030: The system shall support global filters applied before any appender processing; any filter returning false shall drop the event.
- FR-031: Each appender shall support a local filter chain evaluated before writing; any filter returning false shall skip writing for that appender.
- FR-032: A filter shall implement: name, version, kind='filter', enabled:boolean, init(config), filter(event):boolean, dispose().
- FR-033: Built-in match-filter shall support allow (AND) and deny (OR) maps keyed by dot-paths into the Log Event (e.g., 'context.userId', 'data[0].x'). Deny takes precedence.

### 6.5 Formatting
- FR-040: A formatter shall implement: name, version, kind='formatter', init(config), format(event):unknown[], dispose().
- FR-041: Default text formatter must support string template(s) containing tokens such as {timestamp}, {LEVEL}, {level}, {logger}, {message}, {data}, and dot-paths (e.g., {context.userId}).
- FR-042: Default text formatter must support multi-line templates (array of template lines); when a line resolves to the {data} array alone, items shall be expanded in-place; if empty, the token shall be removed.
- FR-043: Default text formatter must support timestamp presets 'iso' | 'locale' and custom tokens: yyyy, yy, MM, dd, hh, h, mm, ss, SSS, SS, S, A, a, z, zz.
- FR-044: Default text formatter must optionally colorize the {LEVEL} token: ANSI sequences in Node.js; CSS styling for browsers; non-color mode outputs plain text.
- FR-045: JSON formatter must output one JSON string per event with configurable fields selection and pretty-print option; timestamp fields must be formatted per the timestampFormat.

### 6.6 Appenders
- FR-050: An appender shall implement: name, version, kind='appender', supportedLevels:Set<LogLevel>, enabled:boolean, priority?:number, init(config, formatter?, filters?), write(event), flush(), dispose(), enableFilter(name), disableFilter(name).
- FR-051: Console appender shall map levels to console methods (error, warn, info, debug, trace, log) with graceful fallbacks; flush is a no-op.
- FR-052: File appender (Node-only) shall open a WriteStream with append or truncate behavior per config; write shall join formatted tokens with spaces plus a newline; flush is a no-op, dispose ends the stream.
- FR-053: Appenders shall skip events whose level is not in supportedLevels or when disabled.
- FR-054: Appenders shall evaluate local filters in order, skipping write on first denial.

### 6.7 Configuration
- FR-060: LoggingConfig shall support: level (default: 'info'), loggers map for per-logger overrides, appenders list, and global filters list.
- FR-061: AppenderConfig shall support: name, enabled?, priority?, formatter (by name or config), filters (by names or config objects).
- FR-062: FilterConfig and FormatterConfig shall include at least a name and enabled? (filters) and may include plugin-specific options.
- FR-063: When a configured plugin factory is not registered, initialization shall fail with a descriptive error.

### 6.8 Plugin System
- FR-070: System shall provide registerPluginFactory(factory) to register custom factories before init(). Registration of a duplicate name shall throw an error.
- FR-071: System shall provide a plugin manager capable of creating plugin instances by kind and config/name; it shall track and dispose created plugins.

### 6.9 Utilities
- FR-080: System shall provide getPropertyByPath(object, path) to resolve nested values and bracketed array indices safely.
- FR-081: System shall provide formatTimestamp(date, pattern) supporting the tokens listed in FR-043 and presets 'iso' and 'locale'.
- FR-082: System shall provide stringifyLog(value, options) with depth, string length, and array length controls; it shall serialize Errors to structured JSON-safe objects including optional cause chains.

## 7. Non-functional Requirements

### 7.1 Usability
- NFR-001: API shall be straightforward for typical logging use-cases with sensible defaults (console + default-formatter at 'info').
- NFR-002: Colorized level output shall degrade gracefully when ANSI/CSS is unavailable.

### 7.2 Compatibility
- NFR-010: Node.js >= 18 is supported; file appender is Node-only; console appender works in both Node and modern browsers.
- NFR-011: Type definitions must be available for TypeScript consumers.

### 7.3 Performance & Capacity
- NFR-020: Disabled log calls shall short-circuit in O(1) using precomputed level thresholds.
- NFR-021: Logging path shall avoid unnecessary allocations and deep cloning; formatters may allocate per output needs.
- NFR-022: Pre-init buffer size shall be capped to prevent unbounded memory growth.

### 7.4 Reliability & Availability
- NFR-030: Errors thrown by appenders shall not crash the application; they shall be caught and logged to console, and processing shall continue for other appenders.
- NFR-031: File appender shall rely on OS/file system buffering; flush/dispose must be callable to help ensure durability on shutdown.

### 7.5 Security & Privacy
- NFR-040: Library shall not attempt to redact sensitive data by default; consumers can add filters to remove/redact fields.
- NFR-041: stringifyLog shall avoid throwing and shall truncate excessively large structures to prevent log injection via extremely large payloads.

### 7.6 Compliance
- NFR-050: No compliance guarantees are provided by the library; consumers are responsible for meeting GDPR/PII requirements via filters and data handling.

## 8. Constraints & Assumptions

### 8.1 Constraints
- C-001: Pre-init buffer maximum size: 100 events (FIFO; oldest dropped when full).
- C-002: Plugin factory names must be globally unique; registering a duplicate shall error.
- C-003: Supported levels are fixed as enumerated in this spec.
- C-004: File appender requires a writable filesystem path and appropriate process permissions.

### 8.2 Assumptions
- A-001: Consumers will not rely on synchronous durability guarantees for file writes unless explicitly flushing/disposing.
- A-002: Consumers may run in browser environments where only console output is applicable.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8

/// Code API for an in-process logging library. Not an HTTP service.
/// Operations represent library entry points and logger methods.
service LogM8Service {
    version: "1.0.0"
    operations: [
        Init,
        Dispose,
        GetLogger,
        SetLoggerLevel,
        SetLoggerContext,
        LogFatal,
        LogError,
        LogWarn,
        LogInfo,
        LogDebug,
        LogTrack,
        LogTrace,
        EnableAppender,
        DisableAppender,
        FlushAppender,
        FlushAppenders,
        EnableFilter,
        DisableFilter,
        RegisterPluginFactory
    ]
}

/// Initialize logging with configuration. Must be called before emitting production logs.
operation Init {
    input: InitInput,
    output: InitOutput,
    errors: [InvalidConfigError, PluginNotFoundError]
}

structure InitInput {
    @required
    config: LoggingConfig
}

structure InitOutput {
    success: Boolean
}

/// Dispose all plugins and clear resources; can be re-initialized later.
operation Dispose {
    input: Unit,
    output: Unit
}

/// Retrieve or create a logger by name; names can be hierarchical (e.g., "app.db").
operation GetLogger {
    input: GetLoggerInput,
    output: GetLoggerOutput
}

structure GetLoggerInput { @required name: String }
structure GetLoggerOutput { @required logger: Logger }

/// Update logger's level.
operation SetLoggerLevel {
    input: SetLoggerLevelInput,
    output: Unit
}

structure SetLoggerLevelInput {
    @required name: String,
    @required level: LogLevel
}

/// Replace logger's context.
operation SetLoggerContext {
    input: SetLoggerContextInput,
    output: Unit
}

structure SetLoggerContextInput {
    @required name: String,
    @required context: Document
}

/// Log operations (message may be string or any serializable document; data is array of documents)
operation LogFatal { input: LogInput, output: Unit }
operation LogError { input: LogInput, output: Unit }
operation LogWarn  { input: LogInput, output: Unit }
operation LogInfo  { input: LogInput, output: Unit }
operation LogDebug { input: LogInput, output: Unit }
operation LogTrack { input: LogInput, output: Unit }
operation LogTrace { input: LogInput, output: Unit }

structure LogInput {
    @required name: String,
    message: Document,
    data: LogDataList
}

list LogDataList { member: Document }

/// Appender control
operation EnableAppender  { input: NamedInput, output: Unit }
operation DisableAppender { input: NamedInput, output: Unit }
operation FlushAppender   { input: NamedInput, output: Unit }
operation FlushAppenders  { input: Unit,       output: Unit }

structure NamedInput { @required name: String }

/// Filter control (global or per-appender when appenderName provided)
operation EnableFilter  { input: FilterControlInput, output: Unit }
operation DisableFilter { input: FilterControlInput, output: Unit }

structure FilterControlInput {
    @required name: String,
    appenderName: String
}

/// Register a custom plugin factory by name and kind. (Code-level registration; no transport.)
/// Implementations must call this before Init.
operation RegisterPluginFactory {
    input: RegisterPluginFactoryInput,
    output: Unit,
    errors: [DuplicatePluginFactoryError]
}

structure RegisterPluginFactoryInput {
    @required name: String,
    @required kind: PluginKind,
    version: String
    /// Additional plugin-specific metadata may be provided out-of-band.
}

// ===== Shapes =====

structure Logger {
    @required name: String,
    @required level: LogLevel,
    @required context: Document,
    @required isEnabled: Boolean,
    @required isFatal: Boolean,
    @required isError: Boolean,
    @required isWarn: Boolean,
    @required isInfo: Boolean,
    @required isDebug: Boolean,
    @required isTrack: Boolean,
    @required isTrace: Boolean
}

structure LoggingConfig {
    level: LogLevel,
    loggers: LoggerLevelMap,
    appenders: AppenderConfigList,
    filters: FilterConfigRefList
}

map LoggerLevelMap { key: String, value: LogLevel }

list AppenderConfigList { member: AppenderConfig }

structure AppenderConfig {
    /// The appender factory name, e.g., "console", "file".
    @required name: String,
    enabled: Boolean,
    priority: Integer,
    /// Either a string (factory name) or full formatter config. If not expressible, pass string and configure via code.
    formatter: FormatterConfigRef,
    /// Each entry may be a string (factory name) or full filter config.
    filters: FilterConfigRefList
}

structure FormatterConfigRef {
    name: String,
    options: Document
}

list FilterConfigRefList { member: FilterConfigRef }

structure FilterConfigRef {
    name: String,
    options: Document,
    enabled: Boolean
}

enum PluginKind { APPENDER, FILTER, FORMATTER }

enum LogLevel { OFF, FATAL, ERROR, WARN, INFO, DEBUG, TRACK, TRACE }

// ===== Errors =====

@error("client")
structure InvalidConfigError { @required message: String }

@error("client")
structure PluginNotFoundError { @required message: String, kind: PluginKind, name: String }

@error("client")
structure DuplicatePluginFactoryError { @required message: String, name: String }

// Notes:
// - Appender/Filter/Formatter-specific option schemas are plugin-defined and not constrained here.
// - Formatter token semantics and timestamp token grammar are specified in prose sections.
// - File appender is for Node; console appender works in both Node and browsers.
```

## 10. Error Handling

### General rules
1. Library shall not throw from logging calls for routine issues; it shall catch appender errors and continue processing other appenders.
2. Initialization shall throw for missing plugin factories or invalid configuration with descriptive messages.
3. Error serialization for JSON output shall avoid throwing and shall handle cause chains safely.
4. Logging APIs shall accept unknown messages/data; formatters decide rendering.

### Error conditions
- E-001: Plugin factory not found (by kind/name) during init → throw PluginNotFoundError.
- E-002: Duplicate plugin factory registration → throw DuplicatePluginFactoryError.
- E-003: File appender stream open/write error → propagate via console error logging while continuing other appenders; dispose ends stream.
- E-004: Filter/formatter exceptions → cause the event to be skipped for that component; other components continue.

## 11. User Interface
No end-user UI. Library is consumed programmatically.

## 12. Acceptance Criteria

### Test categories
- Unit tests: Append/format/filter behavior, utilities, plugin manager, logger flags.
- Integration tests: End-to-end pipeline, filtering precedence, appender/formatter wiring.
- Performance tests: Disabled logging fast-path, filter overhead, formatter costs.
- Security/resilience tests: Filter resilience, safe serialization, no crashes on malformed inputs.
- Usability tests: Reasonable defaults and behavior under minimal configuration.

### Verification
- All existing automated tests in the repository shall pass.
- Adding new plugins per spec shall be possible by implementing the declared interfaces and registering factories before init.
- Manual smoke test: init with default config, emit logs at various levels, confirm expected console/file outputs.

## References
- Built-in plugin names: console, file, default-formatter, json-formatter, match-filter.
- Public types: Log, LoggingConfig, Appender/AppenderConfig, Filter/FilterConfig, Formatter/FormatterConfig, LogLevel, LogM8Utils.
 - API: [/spec/spec-formatters.md](/spec/spec-formatters.md)
 - API: [/spec/spec-appenders.md](/spec/spec-appenders.md)
 - API: [/spec/spec-filters.md](/spec/spec-filters.md)
