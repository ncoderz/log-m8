---
Title: LogM8 Formatters Specification
Version: 1.0.0
Date Created: 2025-08-16
Last Updated: 2025-08-16
---

# Formatters

## 1. Purpose

Specify the behavior and configuration of formatter plugins that transform Log Events into output tokens. Covers the default text formatter and the JSON formatter.

## 2. Scope & Context

### In scope
- Token-based text formatting with templates and timestamp formatting
- Optional colorization of severity level for console output
- JSON serialization with selectable fields and pretty-printing
- Behavior for non-string messages, additional data, and context paths

### Out of scope
- Transport or destination concerns (handled by appenders)
- Data redaction (can be implemented via filters)

### Context
- Formatters are used by appenders to render Log Events to destination-friendly formats.
- They run in both Node.js and browser environments (console appenders may use CSS/ANSI).

## 3. Glossary
- Token: A placeholder like {timestamp} inserted into text templates.
- Pretty printing: Multi-line, indented JSON output for readability.
- ANSI: Terminal color escape codes used by Node consoles.
- CSS Console Styling: Browser console styling using %c and CSS strings.

## 4. Core Features
1. Default text formatting via token templates with multi-line support.
2. Timestamp formatting using presets ('iso', 'locale') and custom token grammar.
3. Optional colorization of {LEVEL} for console-friendly output.
4. JSON formatting with selectable fields, pretty-printing, and safe stringification.

## 5. User Stories
1. As a developer, I can configure human-readable text logs with timestamps and logger names.
2. As an operator, I can enable colorized levels in the console to quickly scan severity.
3. As a developer, I can emit one JSON line per event for ingestion by log processors.
4. As a developer, I can include nested context values without restructuring logs.

## 6. Functional Requirements

### 6.1 Default Text Formatter (name: "default-formatter")
- FMT-001: Accept a format template as a string or array of strings. When an array is provided, each element is a separate output line.
- FMT-002: Support tokens: {timestamp}, {LEVEL}, {level}, {logger}, {message}, {data}, and dot-paths (e.g., {context.userId}, {data[0].foo}).
- FMT-003: {timestamp} formatting shall support presets 'iso' and 'locale' and custom tokens: yyyy, yy, MM, dd, hh, h, mm, ss, SSS, SS, S, A, a, z, zz.
- FMT-004: {LEVEL} is the uppercase level label, padded for alignment. When color is enabled, it shall be colorized (ANSI in Node, CSS tuple via %c in browsers). Without color, plain text is used.
- FMT-005: {message} shall be passed through unchanged when it is not a string (e.g., objects or errors). When used as part of a line with other literals, the result of String(message) is used.
- FMT-006: {data} resolves to the additional data array. When a line equals {data} alone, expand items inline into the output token list. When the array is empty, remove the token.
- FMT-007: Dot-path resolution shall return the referenced value or undefined if not present. In literal-concatenated lines, undefined renders as the string "undefined".
- FMT-008: The formatter shall return an array of tokens suitable for console/file appenders. Multi-line templates produce one array element per line plus in-place expansions for {data}.
- FMT-009: The formatter shall be non-throwing; unexpected errors should result in best-effort rendering or omission of failing parts.

### 6.2 JSON Formatter (name: "json-formatter")
- JFMT-010: Accept a format field list as a string or string array to select output object keys. Default fields: ["timestamp", "level", "logger", "message", "data"].
- JFMT-011: Each format entry is used as the output key and is resolved via dot-path on the Log Event. Special keys:
  - 'timestamp': formatted using the configured timestampFormat (same grammar as 6.1 FMT-003)
  - 'LEVEL': raw level string value (lowercase)
- JFMT-012: When the format list is empty, serialize the entire Log Event object.
- JFMT-013: Pretty printing: pretty=true uses 2 spaces; pretty=number uses that many spaces; pretty unset/false produces compact JSON.
- JFMT-014: Safe stringification shall use bounded depth, string length, and array length. Default limits: depth=3, string=1000, array=100. Values beyond limits are truncated or replaced with placeholders.
- JFMT-015: Errors in message/data shall be serialized as structured objects including name, message, stack, and optional cause chain.
- JFMT-016: Fields that resolve to undefined may be omitted by JSON serialization; no explicit nulls are required.
- JFMT-017: The formatter shall return a single-element array containing the JSON string.
- JFMT-018: The formatter shall not throw; failures shall result in serializing best-effort data.

## 7. Non-functional Requirements
- NFR-FMT-001: Formatter operations shall be lightweight; disabled logging paths should avoid invoking formatters.
- NFR-FMT-002: Output must be deterministic for a given input event, except where locale/clock settings influence timestamp presets.
- NFR-FMT-003: No environment-specific errors: colorization degrades gracefully if not supported.

## 8. Constraints & Assumptions
- C-FMT-001: Only {LEVEL} is colorized; other tokens remain unstyled.
- C-FMT-002: Token list is fixed as specified; unrecognized tokens resolve via dot-path.
- A-FMT-003: Consumers choose text vs JSON according to ingestion needs.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8

// Formatter configuration shapes
structure DefaultFormatterConfig {
  name: String = "default-formatter",
  format: FormatTemplate,
  timestampFormat: String,
  color: Boolean
}

// Accepts string or string[]
union FormatTemplate {
  single: String,
  multi: FormatList
}

list FormatList { member: String }

structure JsonFormatterConfig {
  name: String = "json-formatter",
  format: JsonFieldListOrString,
  timestampFormat: String,
  pretty: PrettyOption,
  maxDepth: Integer,
  maxStringLen: Integer,
  maxArrayLen: Integer
}

union JsonFieldListOrString {
  single: String,
  list: JsonFieldList
}

list JsonFieldList { member: String }

union PrettyOption {
  bool: Boolean,
  spaces: Integer
}
```

## 10. Error Handling
- The formatter shall not throw on malformed tokens or unserializable data.
- JSON serialization shall never throw; problematic values are truncated or converted.

## 11. User Interface
- None. These are programmatic components.

## 12. Acceptance Criteria
- AC-FMT-001: Given default configs, text and JSON outputs match expected shapes for all levels.
- AC-FMT-002: Timestamp presets and custom patterns render correctly.
- AC-FMT-003: Colorization produces ANSI in Node and returns console-compatible tuples for browsers.
- AC-FMT-004: JSON pretty option alters indentation as specified; limits truncate as specified.

## References
- Parent: [/spec/spec.md](/spec/spec.md)
