# Configuration

LogM8 is configured programmatically using a `LoggingConfig` object. You can start with defaults and layer options in as your needs grow.

## Defaults

If you call `Logging.init()` with no arguments:
- Level: `info`
- Appenders: `[ { name: 'console', formatter: 'default-formatter' } ]`
- Global filters: none

## Shape

```ts
interface LoggingConfig {
  level?: LogLevelType;            // 'off'|'fatal'|'error'|'warn'|'info'|'debug'|'track'|'trace'
  loggers?: Record<string, LogLevelType>; // Per-logger overrides
  appenders?: AppenderConfig[];    // Where logs go
  filters?: FilterConfig[];        // Global filter chain
}
```

- AppenderConfig: `name` of the factory, optional `formatter`, `filters`, `enabled`, `priority`.
- Formatter/Filter config entries can be either a string name or `{ name, options }` objects.

## Examples

### Per-logger overrides and hierarchy
```ts
Logging.init({
  level: 'info',
  loggers: {
    'app': 'warn',
    'app.db': 'debug'
  },
});

const root = Logging.getLogger('app');
const svc = root.getLogger('service'); // 'app.service'
root.warn('Root warn');
svc.debug('Service detail');
```

### Global and per-appender filters
```ts
Logging.init({
  filters: [
    { name: 'match-filter', options: { deny: { 'context.env': 'test' } } }
  ],
  appenders: [
    {
      name: 'console',
      formatter: 'default-formatter',
      filters: [ { name: 'match-filter', options: { allow: { 'level': 'error' } } } ]
    }
  ]
});
```

### Priority and runtime control
```ts
Logging.init({
  appenders: [
    { name: 'console', priority: 100, formatter: 'default-formatter' },
    { name: 'file', filename: 'app.log', priority: 10 }
  ]
});

Logging.disableAppender('console');
Logging.enableFilter('match-filter');
Logging.flushAppenders();
```

Back to docs index: ./README.md | Project root: ../README.md
