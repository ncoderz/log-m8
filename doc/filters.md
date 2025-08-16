# Filters (selection)

Filters decide whether a Log Event should be processed. They can be global (run before all appenders) or local to a specific appender.

- Contract: name, version, kind='filter', enabled:boolean, init(config), filter(event): boolean, dispose()
- Deny beats allow when rules conflict
- Errors during evaluation should not crash logging; conservative drop is acceptable

## Match filter (`match-filter`)

Declarative allow/deny based on dot-path matches into the event.

- allow: AND semantics — every rule must match
- deny: OR semantics — any match denies (takes precedence over allow)
- Dot-paths: access nested fields: `context.userId`, `data[0].error.code`, etc.

Config shape:
```ts
{ name: 'match-filter', options: {
  allow?: Record<string, unknown>,
  deny?:  Record<string, unknown>
}}
```

Examples:

Allow only database debug logs:
```ts
{ name: 'match-filter', options: { allow: { 'logger': 'app.db', 'level': 'debug' } } }
```

Drop anything with test environment in context:
```ts
{ name: 'match-filter', options: { deny: { 'context.env': 'test' } } }
```

Match inside `data` array:
```ts
{ name: 'match-filter', options: { deny: { 'data[0].user.role': 'admin' } } }
```

## Where filters run

- Global filters: `filters` at the root of `LoggingConfig`. Run before any appender.
- Per-appender filters: `filters` inside each `AppenderConfig`. Run before that appender writes.

## Runtime control

- Enable/disable globally: `Logging.enableFilter(name)` / `Logging.disableFilter(name)`
- Enable/disable for a specific appender: `Logging.enableFilter(name, 'console')`

Back to docs index: ./README.md | Project root: ../README.md | Spec: ../spec/spec-filters.md
