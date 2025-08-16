---
Title: LogM8 Filters Specification
Version: 1.0.0
Date Created: 2025-08-16
Last Updated: 2025-08-16
---

# Filters

## 1. Purpose

Define the behavior of filter plugins that decide whether a given Log Event should be processed.

## 2. Scope & Context

### In scope
- Global and per-appender filter evaluation semantics
- Filter plugin interface and lifecycle
- Built-in match-filter behavior

### Out of scope
- Redaction or transformation (formatters handle representation; separate transform filters could be added by custom plugins)

### Context
- Global filters run before any appender; appender-local filters run before write.

## 3. Glossary
- Allow rules: All must match to allow (AND semantics).
- Deny rules: Any match denies (OR semantics); deny takes precedence.
- Dot-path: Path resolution into Log Event including bracket indices for arrays.

## 4. Core Features
1. Enabled flag to toggle filter activity at runtime.
2. Deterministic evaluation with deny-over-allow precedence.
3. Robust dot-path resolution for matching nested data.

## 5. User Stories
1. As an operator, I can drop noisy logs globally without changing application code.
2. As a developer, I can filter events at an appender to route only specific categories.
3. As a security engineer, I can block logs that contain particular context markers.

## 6. Functional Requirements

### 6.1 Filter Contract
- FIL-001: Filters implement: name, version, kind='filter', enabled:boolean, init(config), filter(event):boolean, dispose().
- FIL-002: filter(event) returns true to pass or false to drop.
- FIL-003: Filters shall be non-throwing during evaluation; unexpected errors imply a conservative false (drop) or are caught by the caller.

### 6.2 Built-in Match Filter (name: "match-filter")
- FIL-010: Configuration supports allow?:Record<string,unknown> and deny?:Record<string,unknown>.
- FIL-011: Allow: if provided and non-empty, every key/value pair must match (AND) via deep equality (primitives strict, arrays/objects deep, Dates by time).
- FIL-012: Deny: if provided, any key/value match (OR) results in denial. Deny takes precedence over allow.
- FIL-013: Dot-path resolution on Log Event supports bracket indices, e.g., data[0].user.id.
- FIL-014: On unexpected errors during evaluation, the filter returns false (drop) to be conservative.

## 7. Non-functional Requirements
- NFR-FIL-001: Dot-path resolution shall be safe and avoid throwing; unresolved paths yield undefined.
- NFR-FIL-002: Filter evaluation shall be efficient to minimize overhead in hot paths.

## 8. Constraints & Assumptions
- C-FIL-001: Filters do not modify events; they only decide pass/fail.
- A-FIL-002: Additional filter types (e.g., rate limiters) can be added via custom plugins.

## 9. API (Smithy IDL)

```smithy
$version: "2"

namespace com.ncoderz.logm8

structure FilterConfigRef {
  name: String,
  enabled: Boolean,
  options: Document
}

structure MatchFilterConfig {
  name: String = "match-filter",
  enabled: Boolean,
  allow: MapOfAny,
  deny: MapOfAny
}

map MapOfAny { key: String, value: Document }
```

## 10. Error Handling
- Filter evaluation must not throw; errors imply a drop result for safety.

## 11. User Interface
- None.

## 12. Acceptance Criteria
- AC-FIL-001: Deny-over-allow precedence verified with conflicting rules.
- AC-FIL-002: Dot-path resolution works for nested object and array indices.
- AC-FIL-003: Errors during evaluation do not crash logging and conservatively drop.

## References
- Parent: [/spec/spec.md](/spec/spec.md)
