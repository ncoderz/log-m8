## Indexes

### /.ai/memory/index-default-filter
Built-in DefaultFilter: allow/deny semantics, path resolution via dot and bracket notation. Deep equality for arrays/objects, Dates by time, NaN equals NaN. User docs and API reference updated with examples. README includes a "Try it" snippet; JSDoc documents init()/shouldLog() behavior.

## Memories

### /.ai/memory/memory-default-filter-overview
DefaultFilter (factory: "default-filter") provides declarative filtering:
- allow: ALL rules must match (AND) when provided and non-empty.
- deny: ANY rule matching denies (OR). Deny takes precedence.
- Path resolution uses LogM8Utils.getPropertyByPath, supporting `data[0].x` and nested paths like `context.userId`.
- Deep equality for objects/arrays; primitives strict equality; Dates via getTime; NaN equals NaN.
