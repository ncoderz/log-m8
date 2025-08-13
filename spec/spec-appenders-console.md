---
Title: Log-M8 Console Appender Specification
Version: 1.0.0
Date Created: 2025-08-10
Last Updated: 2025-08-10
---

## 1. Purpose

Define the behavior, configuration, and constraints of the built-in Console Appender.

## 2. Scope & Context

### Will do:
- Specify configuration, supported levels, and runtime behavior of the console appender
- Define interaction with formatters and filters
- Define priority, enablement, and flush behavior

### Will not do:
- Log rotation, compression, or retention policies
- Network transport or remote logging

### Context:
- Append-only sink used by Log-M8 to emit formatted log events to the global console

## 3. Glossary

- Enabled: Whether the appender processes events
- Priority: Numeric ordering to decide appender execution sequence (higher runs first)
- Supported Levels: Subset of levels this appender will process

## 4. Core Features

1. Outputs to console methods mapped by level
2. Filter chain with AND semantics and short-circuit on first deny
3. Optional formatter; otherwise emits the raw Log Event object
4. No-op flush
5. Global console required; resilient fallbacks when methods are missing

## 5. User Stories

1. As a developer, I can log to the terminal with appropriate console methods.
2. As a developer, I can add filters to suppress selected events.
3. As a developer, I can control which appender runs first via priority.

## 6. Functional Requirements

### 6.1 Appender Behavior
- FR-CNS-001: The appender exposes: name, version, kind ("appender"), supportedLevels, enabled (default true), priority (default 0), init(config, formatter?, filters?), write(event), flush().
- FR-CNS-002: supportedLevels include: fatal, error, warn, info, debug, track, trace.
- FR-CNS-003: init applies enabled/priority from config and stores provided formatter and filters.
- FR-CNS-004: write evaluates filters in the configured order and skips logging on the first false.

### 6.2 Console Output Semantics (name: "console")
- FR-CNS-010: Map levels to console methods: fatal/error→console.error, warn→console.warn, info→console.info, debug→console.debug, track→console.log, trace→console.trace; fallback to console.log when a specific method is unavailable.
- FR-CNS-011: If a formatter is provided, spread the returned tokens into the chosen console method; otherwise pass the Log Event object as the single argument.
- FR-CNS-012: flush() is a no-op.
- FR-CNS-013: Requires global console availability; if console is unavailable, calls shall no-op.

## 7. Non-functional Requirements

- NFR-CNS-001: Console logging should be resilient to missing console methods; fall back to console.log.
- NFR-CNS-002: Console writes must not throw; errors should be contained and not crash the process.

## 8. Constraints & Assumptions

- C-CNS-001: No rotation/retention; consumer manages output capture/lifecycle.
- A-CNS-001: Formatter output is treated as already serialized tokens; tokens are passed directly to console.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8.appenders.console

use com.ncoderz.logm8#LogEvent
use com.ncoderz.logm8#AppenderConfig

structure ConsoleAppenderConfig extends AppenderConfig {}

@title("Console Appender")
service ConsoleAppenderService {
    version: "1.0.0"
    operations: [ConsoleWrite]
}

operation ConsoleWrite {
    input: ConsoleWriteInput
}

structure ConsoleWriteInput {
    config: ConsoleAppenderConfig
    @required event: LogEvent
}

// Notes:
// - Console methods may be absent; fallback to console.log.
// - Formatter tokens are spread as arguments; without formatter, event object is passed.
```

## 10. Error Handling

- Missing console or method uses safe fallbacks; write errors do not propagate.

## 11. User Interface

None.

## 12. Acceptance Criteria

- Uses correct console methods per level and falls back when unavailable.
- Filters short-circuit; unsupported levels are ignored.
- flush() is a no-op; calls do not throw.

## References

- Root: [/spec/spec.md](/spec/spec.md)
- Plugins: [/spec/spec-plugins.md](/spec/spec-plugins.md)
- Filters: [/spec/spec-filters.md](/spec/spec-filters.md)
- Code: `src/appenders/ConsoleAppender.ts`
