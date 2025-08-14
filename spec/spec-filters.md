Title: Log-M8 Filters Specification
Version: 1.2.0
Date Created: 2025-08-10
Last Updated: 2025-08-15
---

## 1. Purpose

Define the behavior and interface of Filter plugins that allow appenders to determine whether a log event should be logged.

## 2. Scope & Context

### What the system will do:
- Provide a Filter interface extending Plugin
- Allow appenders to evaluate filters before logging events
- Support custom filter implementations through the plugin system
- Provide a built-in MatchFilter for declarative allow/deny matching

### What the system will not do:
- Mutate or transform log events (filters only allow/deny)
- Provide complex evaluation services or APIs

### System Context:
Filters are plugins created and used by appenders during the logging process. Each appender can have zero or more filters that are evaluated before the event is formatted and output.

## 3. Glossary

- **Filter**: A plugin that implements `filter(LogEvent): boolean` to gate log event emission
- **Filter Evaluation**: The process of calling `filter` on each filter in sequence
- **Short-circuit**: Stopping evaluation when the first filter returns false

## 4. Core Features

1. Simple boolean evaluation interface via `filter` method
2. Plugin-based architecture for custom implementations
3. Integration with appender logging workflow
4. Built-in MatchFilter supporting allow/deny maps with path-based matching
5. Runtime enable/disable at global level and per-appender

## 5. User Stories

1. As a developer, I want to create custom filters to suppress log events based on specific criteria
2. As a developer, I want appenders to automatically evaluate filters before logging events
3. As a developer, I want to configure filters per appender to control which events are logged

## 6. Functional Requirements

- FR-FLTR-001: A Filter extends Plugin with methods: `init(FilterConfig)`, `filter(LogEvent): boolean`, `dispose()`
- FR-FLTR-002: Appenders evaluate filters in configuration order before logging; if any returns false, the event is not logged
- FR-FLTR-003: Filters must be synchronous and return boolean values quickly
- FR-FLTR-004: Filters must not mutate the LogEvent or its properties
- FR-FLTR-005: When no filters are configured, appenders proceed with logging (subject to other constraints)
- FR-FLTR-006: MatchFilter shall support configuration with optional `allow` and `deny` maps
- FR-FLTR-007: MatchFilter `allow` map requires ALL rules to match (logical AND) when provided and non-empty
- FR-FLTR-008: MatchFilter `deny` map blocks when ANY rule matches (logical OR); deny takes precedence over allow
- FR-FLTR-009: MatchFilter shall resolve values using dot-paths and bracket indices (e.g., `context.userId`, `data[0].custom[3].path`)
- FR-FLTR-010: MatchFilter comparisons use deep equality for arrays/objects and strict equality for primitives; Dates compare by time value; NaN equals NaN
- FR-FLTR-011: Filters expose an `enabled` flag (default true) that can be set via configuration and toggled at runtime; disabled filters are skipped without affecting order.
- FR-FLTR-012: The manager shall provide enableFilter(name, appenderName?) and disableFilter(name, appenderName?) to toggle global filters or appender-local filters when an appender name is provided.
- FR-FLTR-013: Appenders shall implement enableFilter(name) and disableFilter(name) for toggling their filter instances.

## 7. Non-functional Requirements

### 7.1 Performance & Capacity
- NFR-FLTR-001: Filter evaluation should be fast and avoid unnecessary allocations
- NFR-FLTR-002: Multiple filters should evaluate in O(n) time
- NFR-FLTR-004: MatchFilter path resolution must be robust and avoid throwing on missing paths (returns undefined)

### 7.2 Compatibility
- NFR-FLTR-003: Filters must work in both Node.js and browser environments

## 8. Constraints & Assumptions

### Constraints:
- Filters cannot be asynchronous
- Filters cannot modify log events
- Filter evaluation occurs before formatting

### Assumptions:
- Custom filter implementations are provided by users
- Filter factories are registered before Log-M8 initialization
- MatchFilter is registered by default and available via factory name `match-filter`

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8.filters

use com.ncoderz.logm8#LogEvent
use com.ncoderz.logm8#PluginConfig

// Configuration for filter plugins
structure FilterConfig extends PluginConfig {
    // Configuration is open-ended via PluginConfig.options
    enabled: Boolean
}

// Configuration for the built-in MatchFilter
structure MatchFilterConfig extends FilterConfig {
    // Map of path => expected value; ALL must match to allow (when provided)
    allow: Document
    // Map of path => expected value; ANY match denies (takes precedence)
    deny: Document
}

// Abstract model of filter interface
@title("Filter Interface")
service FilterInterface {
    version: "1.0.0"
    operations: [ShouldLog]
}

// Evaluate whether an event should be logged
operation ShouldLog {
    input: ShouldLogInput
    output: ShouldLogOutput
}

structure ShouldLogInput {
    @required
    event: LogEvent
}

structure ShouldLogOutput {
    @required
    filter: Boolean
}

// Implementation notes:
// - Filters are implemented as TypeScript/JavaScript classes extending Plugin
// - filter() is called synchronously by appenders during write()
// - Filter instances are created per appender during initialization
// - MatchFilter factory name: "match-filter"; supports `allow` (AND) and `deny` (OR) maps
// - Path resolution supports dot and bracket notation (e.g., data[0].x)
// - Disabled filters are skipped; global filters (from LoggingConfig) run before appender-level filters
```

## 10. Error Handling

- Filter initialization errors during Log-M8 setup prevent startup
- Runtime errors in filter evaluation are logged but do not prevent other appenders from processing events

## 11. User Interface

None.

## 12. Acceptance Criteria

- Filters can be implemented by extending the Plugin interface
- Appenders call filter() on each filter in sequence before logging
- When any filter returns false, the event is not logged by that appender
- Filters cannot modify the LogEvent being evaluated
- MatchFilter evaluates allow/deny rules as specified and supports bracket/dot path lookups
- MatchFilter is registered by default and can be configured by name in appender configs

## References

- Root: [/spec/spec.md](/spec/spec.md)
- Plugins: [/spec/spec-plugins.md](/spec/spec-plugins.md)
- Code: `src/Filter.ts`, `src/FilterConfig.ts`, `src/PluginManager.ts`
- Built-in: `src/filters/MatchFilter.ts`, `src/LogM8Utils.ts` (path traversal)
