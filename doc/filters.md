# Filters Guide

Back to README: [../README.md](../README.md)

This guide explains how filtering works in log-m8, including global vs appender-level filters, the `enabled` flag, and runtime toggling.

- Overview
- Global Filters vs Appender Filters
- DefaultFilter (allow/deny)
- Initial Enabled State
- Runtime Enable/Disable
- Examples
- References

At a glance:

```ts
// Start with one disabled filter, one enabled
Logging.init({
  filters: [
    { name: 'default-filter', deny: { 'context.userId': 'blocked' } },
    { name: 'sensitive-data', enabled: false }, // skipped until enabled
  ],
  appenders: [ { name: 'console', formatter: 'default' } ]
});

// Runtime toggles
Logging.enableFilter('sensitive-data');        // globally
Logging.disableFilter('default-filter', 'console'); // scoped to console appender
```

## Overview

Filters are plugins that decide whether a log event should be emitted. Each filter implements:

- name, version, kind: 'filter'
- enabled: boolean (runtime toggle)
- init(config)
- filter(event): boolean
- dispose()

Evaluation is short-circuited: the first filter that returns false blocks the event.
Ordering:
- Global filters (from `Logging.init({ filters })`) run before appender filters.
- Disabled filters are skipped but ordering is preserved.

## Global Filters vs Appender Filters

- Global filters are configured in `Logging.init({ filters: [...] })`.
- They run before any appender-level filters.
- Appender filters are configured per appender in `AppenderConfig.filters`.
- Disabled filters are skipped but left in place (preserve order semantics).

## DefaultFilter (allow/deny)

The built-in `default-filter` supports simple declarative rules:

- allow: ALL rules must match (AND) when provided and non-empty
- deny: ANY rule matching blocks (OR); deny takes precedence over allow
- Paths support dot or bracket notation (e.g., `context.userId`, `data[0].type`)
- Deep equality for arrays/objects; Dates compare by time; NaN equals NaN

Example:

```ts
{
  name: 'default-filter',
  allow: { logger: 'app.service', 'data[0].kind': 'audit' },
  deny:  { 'context.userId': 'blocked' },
}
```

## Initial Enabled State

All filters accept `enabled?: boolean` in their config:

- Omitted -> defaults to true
- When false, the filter is created but skipped during evaluation until enabled

```ts
filters: [
  { name: 'default-filter', deny: { 'context.userId': 'blocked' }, enabled: true },
  { name: 'sensitive-data', enabled: false }, // start disabled
]
```

## Runtime Enable/Disable

Toggle filters without changing configuration:

```ts
// Globally
Logging.disableFilter('sensitive-data');
Logging.enableFilter('sensitive-data');

// Scoped to a specific appender
Logging.disableFilter('sensitive-data', 'console');
Logging.enableFilter('sensitive-data', 'console');
```

Notes:
- Global toggles affect global filter instances only.
- Scoped toggles affect only the named appender's filter instance.
- Appenders also expose `enableFilter(name)` / `disableFilter(name)`; the manager delegates to these when scoping is provided.

## Examples

### Global and Appender Filters Together

```ts
Logging.init({
  level: 'info',
  filters: [ // global
    { name: 'default-filter', deny: { 'context.userId': 'blocked' } },
  ],
  appenders: [
    {
      name: 'console',
      formatter: { name: 'default', color: true },
      filters: [
        'sensitive-data',
        { name: 'default-filter', allow: { logger: 'app.api' }, enabled: false },
      ],
    },
  ],
});

const api = Logging.getLogger('app.api');
api.setContext({ userId: 'ok' });
api.info('visible');

Logging.disableFilter('sensitive-data', 'console'); // allow sensitive messages on console only
api.info('message with token=***');
```

### Toggling for Troubleshooting

```ts
// Temporarily disable all filtering to diagnose issues
Logging.disableFilter('default-filter');
Logging.disableFilter('sensitive-data');

// Re-enable after investigation
Logging.enableFilter('default-filter');
Logging.enableFilter('sensitive-data');
```

## References

- README: ../README.md
- API Reference: ./api.md
- Specs: ../spec/spec-filters.md, ../spec/spec.md
 - Back to README: ../README.md
