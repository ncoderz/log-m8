---
Title: Log-M8 Default Formatter Specification
Version: 1.0.0
Date Created: 2025-08-10
Last Updated: 2025-08-10
---

## 1. Purpose

Specify the behavior and configuration of the built-in Default Formatter, which converts Log Events into either text tokens (with optional colorization) or a single JSON object using a tokenized template system and flexible timestamp formatting.

## 2. Scope & Context

### Will do:
- Define configuration schema and defaults
- Define token syntax and resolution rules
- Define timestamp formatting tokens and presets
- Define colorization behavior for Node.js and browsers
- Define JSON vs text output behaviors and default templates

### Will not do:
- Data redaction
- Custom serialization hooks beyond JSON.stringify in appenders

### Context:
- Used by appenders (console, file, and custom) to format Log Events for output.

## 3. Glossary

- Token: Placeholder like `{timestamp}` resolved against a Log Event
- Text Mode: Returns an array of string/values intended to be spread into console/file
- JSON Mode: Returns a single object wrapped in an array for appenders to log
- Level Mapping: Precomputed mapping of level string to either a colored string or a tuple for browser styling

## 4. Core Features

1. Tokenized templates supporting literals and placeholders
2. Flexible timestamp formatter with presets (iso, locale) and tokens (yyyy, yy, MM, dd, hh, h, mm, ss, SSS, SS, S, A, a, z, zz)
3. Optional colorization (ANSI in Node, CSS in browsers)
4. Dual modes: text (default) and JSON (json: true)
5. Safe default templates for both modes

## 5. User Stories

1. As a developer, I can output readable text logs with a timestamp, level, logger name, message, and data.
2. As a developer, I can output structured JSON logs with standardized fields.
3. As a developer, I can customize format templates and timestamp format.
4. As a developer, I can enable colorized levels in terminals or browsers.

## 6. Functional Requirements

- FR-FMT-001: Accept configuration fields: format (string | string[]), timestampFormat (string), color (boolean), json (boolean).
- FR-FMT-002: Default behavior when json=false:
  - Default format lines: ["{timestamp} {LEVEL} [{logger}] {message}", "{data}"]
  - Returns an array of values, potentially multiple strings; if an element resolves to an array (e.g., `{data}`), it is expanded or removed when empty.
- FR-FMT-003: Default behavior when json=true:
  - Default fields: ["{timestamp}", "{level}", "{logger}", "{message}", "{data}"]
  - Returns a single object with keys equal to token names, wrapped in a one-element array.
  - Literal strings in templates are ignored in JSON mode.
- FR-FMT-004: Token resolution rules:
  - Tokens are delimited by `{` and `}`; contents are a key such as `timestamp`, `LEVEL`, `level`, `logger`, `message`, `data`, or a dot-path into the Log Event (e.g., `context.userId`, `data.0`).
  - `LEVEL` returns uppercased level, with colorization if enabled in text mode; in JSON mode, `LEVEL` returns the original lowercase level.
  - `timestamp` resolves to the event timestamp formatted using the timestamp formatter and current `timestampFormat`.
  - Non-token text is preserved literally in text mode.
- FR-FMT-005: Timestamp formatting:
  - Presets: `iso` (toISOString), `locale` (toLocaleString)
  - Tokenized formats supported: yyyy, yy, MM, dd, hh, h, mm, ss, SSS, SS, S, A, a, z, zz.
- FR-FMT-006: Colorization:
  - When `color=true` and running in Node.js, levels are wrapped in ANSI escape sequences.
  - When `color=true` and running in browser, the first token becomes a `%c...` string and a second argument supplies a CSS style.
  - When `color=false`, levels are plain strings.
- FR-FMT-007: If no `format` is provided:
  - Text mode fallback array: [formatted timestamp, level (lowercase), logger, message, ...data, context]
  - JSON mode fallback: the entire Log Event object as a single element array.

## 7. Non-functional Requirements

- NFR-FMT-001: Resolution and formatting should be allocation-light for common tokens.
- NFR-FMT-002: JSON mode should be deterministic and omit literal tokens.

## 8. Constraints & Assumptions

- C-FMT-001: Dot-path access may traverse arrays using numeric indices.
- C-FMT-002: The formatter does not mutate the input Log Event.
- A-FMT-001: Append-only formatting; appenders are responsible for serialization and emission.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8.formatters

use com.ncoderz.logm8#LogEvent

structure DefaultFormatterConfig {
    // string | string[]
    format: FormatTemplates
    // "iso", "locale", or tokenized pattern
    timestampFormat: String
    // Enable colorization (ANSI in Node, CSS in browser)
    color: Boolean
    // When true, returns a single object in an array
    json: Boolean
}

list TemplateList { member: String }
union FormatTemplates {
    single: String
    multiple: TemplateList
}

@title("Default Formatter")
service DefaultFormatterService {
    version: "1.0.0"
    operations: [Format]
}

operation Format {
    input: FormatInput
    output: FormatOutput
}

structure FormatInput {
    config: DefaultFormatterConfig
    @required
    event: LogEvent
}

structure FormatOutput {
    // Array of output tokens; in JSON mode, a single object element
    @required
    tokens: TokenList
}

list TokenList { member: Document }

// Notes:
// - LEVEL renders uppercased text in text mode, original lowercase in JSON mode.
// - Timestamp token uses the configured timestampFormat.
// - Literal tokens are ignored in JSON mode.
```

## 10. Error Handling

- Invalid timestamp patterns are treated as literal strings; no exception thrown by formatter.
- Missed token keys resolve to undefined (leading to empty strings when concatenated in text mode).

## 11. User Interface

None.

## 12. Acceptance Criteria

- Text mode with defaults emits two entries: header line and expanded data (or skips when empty).
- JSON mode with defaults emits an object with keys timestamp, level, logger, message, data.
- Colorization toggles ANSI/CSS styles and leaves JSON unaffected.
- Timestamp formats render correctly for all documented tokens.

## References

- Root: [/spec/spec.md](/spec/spec.md)
- Plugins: [/spec/spec-plugins.md](/spec/spec-plugins.md)
- Code: `src/formatters/DefaultFormatter.ts`, `src/LogM8Utils.ts`
