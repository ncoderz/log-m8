---
Title: Log-M8 File Appender Specification
Version: 1.0.0
Date Created: 2025-08-10
Last Updated: 2025-08-10
---

## 1. Purpose

Define the behavior, configuration, and constraints of the built-in File Appender (Node.js only).

## 2. Scope & Context

### Will do:
- Specify configuration, supported levels, and runtime behavior of the file appender
- Define interaction with formatters and filters
- Define enablement, priority, and lifecycle (open/close)

### Will not do:
- Log rotation, compression, or retention policies
- Network transport or remote logging

### Context:
- Append-only sink used by Log-M8 to emit formatted log events to a filesystem file via Node.js streams

## 3. Glossary

- Enabled: Whether the appender processes events
- Priority: Numeric ordering to decide appender execution sequence (higher runs first)
- Supported Levels: Subset of levels this appender will process

## 4. Core Features

1. Writes line-oriented text to a file via Node.js write streams
2. Filter chain with AND semantics and short-circuit on first deny
3. Optional formatter; otherwise writes JSON-serialized Log Event
4. Newline-terminated lines
5. Append or overwrite semantics at initialization

## 5. User Stories

1. As a developer, I can write logs to a file path with append or overwrite semantics.
2. As a developer, I can add filters to suppress selected events.
3. As a developer, I can control which appender runs first via priority.

## 6. Functional Requirements

### 6.1 Appender Behavior
- FR-FIL-001: The appender exposes: name, version, kind ("appender"), supportedLevels, enabled (default true), priority (default 0), init(config, formatter?, filters?), write(event), flush(), dispose().
- FR-FIL-002: supportedLevels include: fatal, error, warn, info, debug, track, trace.
- FR-FIL-003: init applies enabled/priority from config and stores provided formatter and filters.
- FR-FIL-004: write evaluates filters in the configured order and skips logging on the first false.

### 6.2 File Output Semantics (name: "file")
- FR-FIL-010: Configuration fields: filename (required), append (boolean, default false).
- FR-FIL-011: On init, open a write stream with flags: 'a' if append=true, else 'w'. If stream creation fails, writes shall no-op until re-initialized.
- FR-FIL-012: If a formatter is provided, join tokens into a single line; non-strings are JSON.stringify'd (best effort), then joined by a single space. If no formatter is provided, stringify the Log Event as JSON.
- FR-FIL-013: Each write appends a trailing newline character to the file.
- FR-FIL-014: dispose() closes the stream; flush() is a no-op (OS buffers apply).
- FR-FIL-015: Requires Node.js fs module and a writeable path; not supported in browsers.

## 7. Non-functional Requirements

- NFR-FIL-001: File I/O should avoid throwing during write; errors should not crash the process.
- NFR-FIL-002: Opened stream should be reused across writes and closed on dispose.

## 8. Constraints & Assumptions

- C-FIL-001: No rotation/retention; consumers manage file lifecycle.
- C-FIL-002: Not supported in browsers.
- A-FIL-001: Formatter output tokens may include non-strings; these are stringified for line output.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8.appenders.file

use com.ncoderz.logm8#LogEvent
use com.ncoderz.logm8#AppenderConfig

structure FileAppenderConfig extends AppenderConfig {
    @required filename: String
    append: Boolean
}

@title("File Appender")
service FileAppenderService {
    version: "1.0.0"
    operations: [FileWrite]
}

operation FileWrite {
    input: FileWriteInput
}

structure FileWriteInput {
    config: FileAppenderConfig
    @required event: LogEvent
}

// Notes:
// - Lines are single-line strings terminated with \n.
// - If stream cannot be opened, writes no-op until successfully initialized.
```

## 10. Error Handling

- Stream creation failures lead to no-ops; write stringification failures fall back to String(value) for individual tokens.

## 11. User Interface

None.

## 12. Acceptance Criteria

- Writes newline-terminated lines honoring append vs overwrite.
- Closes stream on dispose; flush() is a no-op.
- Filters short-circuit; unsupported levels are ignored.

## References

- Root: [/spec/spec.md](/spec/spec.md)
- Plugins: [/spec/spec-plugins.md](/spec/spec-plugins.md)
- Filters: [/spec/spec-filters.md](/spec/spec-filters.md)
- Code: `src/appenders/FileAppender.ts`
