---
Title: Log-M8 Filters Specification
Version: 1.0.0
Date Created: 2025-08-10
Last Updated: 2025-08-10
---

## 1. Purpose

Define the behavior, configuration, and lifecycle of Filter plugins that decide whether a Log Event should be emitted by a given appender.

## 2. Scope & Context

### Will do:
- Specify the Filter interface and lifecycle
- Define evaluation order, short-circuit semantics, and appender scoping
- Describe configuration, validation, and error behavior

### Will not do:
- Provide built-in filters (none are included by default)
- Perform data redaction or mutation (filters only allow/deny)

### Context:
- Filters are created per-appender and evaluated during appender.write before formatting/output.

## 3. Glossary

- Filter: Plugin with `shouldLog(LogEvent): boolean` that gates emission
- Filter Chain: Ordered list of filters attached to an appender, evaluated with AND semantics
- Short-circuit: Stop evaluation on the first filter returning false
- Stateless/Stateful: Filters may maintain internal state but must not mutate Log Events

## 4. Core Features

1. Synchronous boolean gating via `shouldLog`
2. Deterministic order as configured on the appender
3. Short-circuit evaluation (first false denies the event for that appender)
4. Per-appender scoping (independent instances, independent state)
5. Open-ended configuration via `PluginConfig`

## 5. User Stories

1. As a developer, I can attach filters to suppress events not relevant to an output (e.g., by logger name or context).
2. As a developer, I can combine multiple filters that must all approve before logging.
3. As a developer, I can build custom filters and register their factories for use in configuration.

## 6. Functional Requirements

- FR-FLTR-001: A Filter is a Plugin with fields name, version, kind ("filter"), and methods: init(FilterConfig), shouldLog(LogEvent): boolean, dispose().
- FR-FLTR-002: Filters are constructed by the Plugin Manager using a registered factory and initialized with the provided FilterConfig.
- FR-FLTR-003: Appenders evaluate filters in the order listed in their configuration; if any returns false, the event MUST NOT be logged by that appender.
- FR-FLTR-004: Filters MUST be synchronous and return quickly; they MUST NOT perform long-running I/O.
- FR-FLTR-005: Filters MUST treat the Log Event as immutable (no mutation of event or nested properties).
- FR-FLTR-006: Filters MAY maintain internal state across evaluations of the same appender instance.
- FR-FLTR-007: If a filter throws during evaluation, the containing appender’s write for that event fails; other appenders continue to process the event.
- FR-FLTR-008: When no filters are configured, the appender MUST emit the event (subject to supportedLevels and other gates).
- FR-FLTR-009: supportedLevels gate is evaluated prior to filter evaluation; events with unsupported levels are not passed to filters.
- FR-FLTR-010: Filter configuration keys are open-ended; filters MUST validate and handle missing/invalid options themselves.

## 7. Non-functional Requirements

- NFR-FLTR-001: Filter evaluation per event should be O(n) in the number of filters with constant-time checks inside individual filters.
- NFR-FLTR-002: Filters should avoid allocations on the hot path where practical.
- NFR-FLTR-003: Filters MUST be environment-agnostic (Node/browser).

## 8. Constraints & Assumptions

- C-FLTR-001: Filters are evaluated after level gating and before formatting/output.
- C-FLTR-002: Filters are not asynchronous.
- A-FLTR-001: Filter factories are registered before Log-M8 initialization so they can be referenced by name in appender configs.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8.filters

use com.ncoderz.logm8#LogEvent
use com.ncoderz.logm8#PluginConfig

// Configuration shape for a filter plugin
structure FilterConfig extends PluginConfig {}

list FilterConfigList { member: FilterConfig }

// Conceptual service modeling filter evaluation
@title("Filter Evaluation")
service FilterService {
    version: "1.0.0"
    operations: [EvaluateFilter, EvaluateFilterChain]
}

// Evaluate a single filter
operation EvaluateFilter {
    input: EvaluateFilterInput
    output: EvaluateFilterOutput
}

structure EvaluateFilterInput {
    @required config: FilterConfig
    @required event: LogEvent
}

structure EvaluateFilterOutput { @required allow: Boolean }

// Evaluate an ordered chain of filters with AND + short-circuit semantics
operation EvaluateFilterChain {
    input: EvaluateFilterChainInput
    output: EvaluateFilterOutput
}

structure EvaluateFilterChainInput {
    @required filters: FilterConfigList
    @required event: LogEvent
}

// Notes:
// - Real evaluation occurs inside appenders during write(); this service is an abstract model.
// - If any filter errors, the containing appender fails for the event; other appenders continue.
```

## 10. Error Handling

- Filter initialization errors (invalid config) surface during Log-M8 initialization.
- Filter evaluation errors cause the containing appender to fail for that event; the failure is logged and other appenders continue.

## 11. User Interface

None.

## 12. Acceptance Criteria

- Filters run in configuration order and short-circuit on first false.
- No filters configured → events pass through (subject to level support).
- Throwing filter → appender write for that event fails, other appenders still process the event.
- Filters do not mutate Log Events; subsequent processing sees original values.

## References

- Root: [/spec/spec.md](/spec/spec.md)
- Plugins: [/spec/spec-plugins.md](/spec/spec-plugins.md)
- Code: `src/Filter.ts`, `src/FilterConfig.ts`, `src/PluginManager.ts`
