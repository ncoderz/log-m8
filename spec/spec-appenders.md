---
Title: LogM8 Appenders Specification
Version: 1.0.0
Date Created: 2025-08-16
Last Updated: 2025-08-16
---

# Appenders

## 1. Purpose

Define behavior of appender plugins that output formatted Log Events to destinations.

## 2. Scope & Context

### In scope
- Console appender behavior and level-to-method mapping
- File appender behavior for Node.js
- Appender initialization, priority ordering, enable/disable, filter integration

### Out of scope
- Network/storage appenders (may be added by plugins)

### Context
- Appenders receive formatted tokens from formatters and write to outputs.
- Appenders can maintain local filter chains and can be enabled/disabled at runtime.

## 3. Glossary
- Priority: Numeric ordering; higher value executes earlier.
- Supported levels: Set of levels an appender will process.

## 4. Core Features
1. Console output with graceful method fallbacks.
2. File output with append/overwrite behavior at startup.
3. Per-appender enable switch and priority sorting.
4. Local filter chains and global filter integration.

## 5. User Stories
1. As an operator, I can disable the console appender without reconfiguring the entire system.
2. As a developer, I can write logs to a rotating file handler by implementing a custom appender.
3. As a developer, I can ensure error-level logs go to the console before debug logs by using priority.

## 6. Functional Requirements

### 6.1 Common Appender Contract
- APP-001: Appenders implement: name, version, kind='appender', supportedLevels:Set, enabled:boolean, priority?:number, init(config, formatter?, filters?), write(event), flush(), dispose(), enableFilter(name), disableFilter(name).
- APP-002: write(event) shall apply local filters in order; any false result skips writing.
- APP-003: Appenders shall skip events when disabled or when level not in supportedLevels.
- APP-004: Errors during write/flush shall be caught; system continues processing other appenders.

### 6.2 Console Appender (name: "console")
- APP-010: Map levels to console methods with fallbacks: error→console.error|log, warn→console.warn|log, info→console.info|log, debug→console.debug|log, trace→console.trace|log, track→console.log, fatal→console.error|log.
- APP-011: When console is unavailable, the appender shall no-op without error.
- APP-012: flush() is a no-op; outputs occur immediately.
- APP-013: supportedLevels include all except 'off'.

### 6.3 File Appender (name: "file")
- APP-020: Node-only. On init, open a WriteStream to the configured filename; flags determined by append (append:true→'a', false/undefined→'w').
- APP-021: write(event) shall join formatted tokens with a single space and append a newline. Non-strings are converted via String(value).
- APP-022: flush() is a no-op; dispose() ends the stream and releases the file handle.
- APP-023: supportedLevels include all except 'off'.

## 7. Non-functional Requirements
- NFR-APP-001: Appenders must avoid throwing; errors are logged to console and do not interrupt other appenders.
- NFR-APP-002: Console detection must not cause side effects in browsers or Node.

## 8. Constraints & Assumptions
- C-APP-001: File appender requires filesystem write permissions.
- C-APP-002: No built-in rotation; external solutions or custom appenders may provide it.
- A-APP-003: Formatting occurs before writing; appender may accept raw events when no formatter is supplied.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8

structure ConsoleAppenderConfig {
  name: String = "console",
  enabled: Boolean,
  priority: Integer,
  formatter: FormatterConfigRef,
  filters: FilterConfigRefList
}

structure FileAppenderConfig {
  name: String = "file",
  enabled: Boolean,
  priority: Integer,
  formatter: FormatterConfigRef,
  filters: FilterConfigRefList,
  filename: String,
  append: Boolean
}
```

## 10. Error Handling
- Console unavailable → no-op writes, no throw.
- File stream open/write errors → log to console; other appenders continue.

## 11. User Interface
- None.

## 12. Acceptance Criteria
- AC-APP-001: Console appender writes with correct console method per level.
- AC-APP-002: File appender writes one line per event with correct joining behavior.
- AC-APP-003: Enable/disable and priority sorting behave deterministically.

## References
- Parent: [/spec/spec.md](/spec/spec.md)
