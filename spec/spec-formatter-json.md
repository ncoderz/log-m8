---
Title: Log-M8 JSON Formatter Specification
Version: 1.0.0
Date Created: 2025-08-16
Last Updated: 2025-08-16
---

## 1. Purpose

Specify the behavior and configuration of the built-in Json Formatter, which converts Log Events into a single JSON string (wrapped as an array element for appenders) with controls for timestamp formatting and output size (max depth, string length, array length) via LogM8Utils.stringifyLog.

## 2. Scope & Context

### Will do:
- Define configuration schema and defaults
- Define field selection via string or list of keys
- Define timestamp formatting for the `timestamp` field
- Define pretty printing and size guard options

### Will not do:
- Colorization
- Token/literal text composition

### Context:
- Used by appenders (console, file, and custom) for structured logging. Returns a single JSON string value per event for emission.

## 3. Core Features

1. Selectable fields via `format` (string | string[])
2. Timestamp formatting presets and patterns for the `timestamp` field
3. Pretty printing control (`pretty`: boolean | number)
4. Output size guards via stringify options: maxDepth, maxStringLen, maxArrayLen

## 4. Functional Requirements

- FR-JF-001: Accept config fields: format (string | string[]), timestampFormat (string), pretty (boolean | number), maxDepth (number), maxStringLen (number), maxArrayLen (number).
- FR-JF-002: Default format is ["timestamp", "level", "logger", "message", "data"]. If `format` is a single string, it is treated as a single key.
- FR-JF-003: When `format` is provided, construct an object whose keys are the items in `format` and values are resolved from the Log Event by dot-path.
- FR-JF-004: Special cases:
  - `LEVEL` uses the original lowercase `event.level` value.
  - `timestamp` uses LogM8Utils.formatTimestamp(event.timestamp, timestampFormat).
- FR-JF-005: If `format` is empty, use the entire Log Event object.
- FR-JF-006: Return value is an array with a single string: JSON produced by LogM8Utils.stringifyLog with provided size guards and pretty setting.

## 5. Non-functional Requirements

- NFR-JF-001: Deterministic output order matching the provided `format` list.
- NFR-JF-002: Safe serialization for arbitrary data, with truncation according to size guards.

## 6. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8.formatters

use com.ncoderz.logm8#LogEvent

structure JsonFormatterConfig {
    // Keys to include; string or list
    format: JsonFormat
    // Timestamp format: "iso", "locale", or tokenized pattern
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

@title("Json Formatter")
service JsonFormatterService {
    version: "1.0.0"
    operations: [Format]
}

operation Format {
    input: FormatInput
    output: FormatOutput
}

structure FormatInput {
    config: JsonFormatterConfig
    @required
    event: LogEvent
}

structure FormatOutput {
    // One JSON string per event
    @required
    tokens: TokenList
}

list TokenList { member: String }

// Notes:
// - LEVEL yields the lowercase level string.
// - timestamp uses LogM8Utils.formatTimestamp.
// - stringifyLog applies depth/length limits and handles Error, BigInt, and Date values.
```

## 7. Acceptance Criteria

- Default config produces a JSON object string with timestamp, level, logger, message, and data keys.
- pretty: true indents with 2 spaces; pretty: number indents with that number of spaces.
- maxDepth, maxStringLen, and maxArrayLen influence output as described in LogM8Utils.stringifyLog.

## References

- Root: [/spec/spec.md](/spec/spec.md)
- Code: `src/formatters/JsonFormatter.ts`, `src/LogM8Utils.ts`
