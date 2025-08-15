---
Title: Log-M8 MatchFilter Specification
Version: 1.0.0
Date Created: 2025-08-10
Last Updated: 2025-08-15
---

## 1. Purpose

Define the behavior, configuration, and constraints of the built-in MatchFilter. MatchFilter provides declarative allow/deny rules using dot/bracket path lookups into LogEvent fields.

## 2. Scope & Context

### Will do:
- Specify configuration schema and evaluation semantics for MatchFilter
- Define path resolution and equality rules
- Define enable/disable behavior and interactions with appenders and the Log-M8 manager

### Will not do:
- Transform or mutate LogEvent data
- Perform asynchronous or external lookups

### Context:
- Used as a Filter plugin within appender filter chains and/or global filters in Log-M8

## 3. Glossary

- Allow map: A map of path => expected value. All specified entries must match for an event to be allowed (logical AND), when provided and non-empty.
- Deny map: A map of path => expected value. Any matching entry denies the event (logical OR). Deny takes precedence over allow.
- Path: Dot/bracket notation to traverse objects and arrays, e.g., `context.userId`, `data[0].details[2].id`.

## 4. Core Features

1. Declarative allow/deny configuration with precedence for deny
2. Dot/bracket path resolution across LogEvent, including nested arrays/objects
3. Deep equality for arrays/objects; strict equality for primitives; Date equality by time value; NaN equals NaN
4. Enabled flag to toggle evaluation without removing the filter

## 5. User Stories

1. As a developer, I can deny events for a specific logger or user quickly using simple rules.
2. As a developer, I can allow only error-level events from a subsystem while denying verbose logs.
3. As a developer, I can target nested data and context fields using path expressions.

## 6. Functional Requirements

- FR-MF-001: MatchFilter shall accept configuration with optional `allow` and `deny` maps in options.
- FR-MF-002: When `deny` contains one or more entries, if any path resolves to a value equal to its expected value, the event is denied.
- FR-MF-003: When `allow` contains one or more entries, all paths must resolve to values equal to their expected values for the event to be allowed; otherwise it is denied.
- FR-MF-004: If both `allow` and `deny` are provided, `deny` is evaluated first; any match results in denial regardless of `allow`.
- FR-MF-005: If neither `allow` nor `deny` is provided (or both are empty), the filter shall allow all events.
- FR-MF-006: Path resolution supports dot and bracket syntax; missing paths resolve to `undefined` and never throw.
- FR-MF-007: Equality semantics: primitives compare by strict equality (`===`), objects/arrays by deep structural equality; `Date` objects compare by time value; `NaN` equals `NaN`.
- FR-MF-008: The filter exposes an `enabled` boolean (default true). When disabled, evaluation is skipped and the filter is treated as allowing (i.e., does not affect the decision).
- FR-MF-009: The filter implements the Filter interface: `init(FilterConfig)`, `filter(LogEvent): boolean`, `dispose()`; `name` is `"match-filter"`.
- FR-MF-010: The filter must be usable as a global filter (in `LoggingConfig.filters`) and at appender scope; behavior is identical in both contexts.

## 7. Non-functional Requirements

- NFR-MF-001: Path resolution must be allocation-light and must not throw on bad paths.
- NFR-MF-002: Evaluation should be O(a + d + p), where a, d are counts of allow/deny rules and p is the average path length.
- NFR-MF-003: Works in Node.js and modern browsers.

## 8. Constraints & Assumptions

- C-MF-001: Evaluation is synchronous.
- C-MF-002: Filter must not mutate the input event.
- A-MF-001: Factory for MatchFilter is registered by default under the name `match-filter`.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8.filters.match

use com.ncoderz.logm8#LogEvent
use com.ncoderz.logm8#PluginConfig

structure MatchFilterConfig extends PluginConfig {
	// Map of path => expected value; ALL must match to allow (when provided)
	allow: Document
	// Map of path => expected value; ANY match denies (takes precedence)
	deny: Document
	// Initial enabled state (default true)
	enabled: Boolean
}

@title("MatchFilter")
service MatchFilterService {
	version: "1.0.0"
	operations: [Evaluate]
}

operation Evaluate {
	input: EvaluateInput
	output: EvaluateOutput
}

structure EvaluateInput { @required event: LogEvent, config: MatchFilterConfig }
structure EvaluateOutput { @required allow: Boolean }

// Notes:
// - Deny is evaluated before allow; a deny match short-circuits to false.
// - Missing paths resolve to undefined and do not throw.
// - Deep equality for objects/arrays; Date compares by time value; NaN equals NaN.
```

## 10. Error Handling

- Invalid configuration types in `allow`/`deny` are treated as non-matching; initialization may validate shapes and throw on irrecoverable misconfiguration.
- Runtime exceptions during evaluation are caught by the caller (appender/manager) and must not prevent other appenders/filters from running.

## 11. User Interface

None.

## 12. Acceptance Criteria

- Deny precedence: any deny rule match yields false regardless of allow.
- Allow AND semantics: when non-empty, all allow rules must match for true.
- Path parsing supports both dot and bracket notation including numeric indices.
- Equality semantics cover primitives, objects/arrays, Dates, and NaN.
- Disabled filter is skipped and does not affect the outcome.

## References

- Root: [/spec/spec.md](/spec/spec.md)
- Filters (generic): [/spec/spec-filters.md](/spec/spec-filters.md)
- Plugins: [/spec/spec-plugins.md](/spec/spec-plugins.md)
- Code: `src/filters/MatchFilter.ts`, `src/LogM8Utils.ts` (path traversal)

