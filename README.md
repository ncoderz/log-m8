# LogM8

Pluggable, hierarchical logging for TypeScript/JavaScript. Clean APIs, sensible defaults, and a tiny core you can extend with your own appenders, formatters, and filters.

## Table of Contents

- [LogM8](#logm8)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Hierarchical Loggers](#hierarchical-loggers)
  - [Log Levels](#log-levels)
  - [Context](#context)
  - [Appenders](#appenders)
  - [Formatters](#formatters)
  - [Filters](#filters)
  - [Runtime Control](#runtime-control)
  - [Custom Plugins](#custom-plugins)
  - [API Documentation](#api-documentation)
  - [Environment Compatibility](#environment-compatibility)
  - [License](#license)

## Features

- Levels: off, fatal, error, warn, info, debug, track, trace
- Hierarchical loggers with per-logger level overrides
- Built-in plugins: console and file appenders; default (text) and JSON formatters; match-based filter
- Runtime toggles for appenders and filters; appender priority
- Works in Node.js and the browser (console only in browsers)
- Performance-minded: O(1) fast-path for disabled logs, minimal allocations

## Quick Start

```ts
import { Logging } from 'log-m8';

// One-liner setup (console + readable text format at level "info")
Logging.init();

const log = Logging.getLogger('app');
log.info('Application started');
log.debug('User session', { id: 'u-123' });
```

JSON output instead of text:

```ts
Logging.init({
  appenders: [
    { name: 'console', formatter: 'json-formatter' }
  ]
});
```

File output (Node-only):

```ts
Logging.init({
  appenders: [
    { name: 'file', filename: 'app.log', formatter: 'default-formatter' }
  ]
});
```

## Installation

Install the package and import the singleton manager `Logging`.

```fish
npm install log-m8
```

```ts
import { Logging } from 'log-m8';
```

## Configuration

Start with sensible defaults and layer options as needed. See full guide in `./doc/configuration.md`.

```ts
Logging.init({
  level: 'info',
  loggers: { 'app.db': 'debug' },
  filters: [
    { name: 'match-filter', options: { deny: { 'context.env': 'test' } } }
  ],
  appenders: [
    { name: 'console', formatter: 'default-formatter' },
    {
      name: 'file',
      filename: 'app.log',
      formatter: { name: 'json-formatter', options: { pretty: 2 } },
      filters: [{ name: 'match-filter', options: { allow: { level: 'error' } } }]
    }
  ]
});
```

More: `./doc/configuration.md`.

## Hierarchical Loggers

Logger names are dot-separated. Child loggers inherit from parents, and you can set per-logger levels.

```ts
const root = Logging.getLogger('app');
const db = root.getLogger('db'); // 'app.db'
root.warn('Root warn');
db.debug('SQL detail');
```

Configure overrides:

```ts
Logging.init({ loggers: { 'app': 'warn', 'app.db': 'debug' } });
```

## Log Levels

Order (low → high verbosity): off < fatal < error < warn < info < debug < track < trace.

- Methods: fatal, error, warn, info, debug, track, trace
- Flags: isFatal, isError, isWarn, isInfo, isDebug, isTrack, isTrace
- Calls below the logger’s level short-circuit with near-zero overhead

## Context

Attach lightweight metadata to every event. It’s included in each log and usable by formatters and filters.

```ts
const auth = Logging.getLogger('auth');
auth.setContext({ env: 'prod', service: 'api', userId: 'u-123' });
auth.info('User logged in');
```

Render in text:

```ts
Logging.init({
  appenders: [{
    name: 'console',
    formatter: { name: 'default-formatter', options: {
      format: '{timestamp} {LEVEL} [{logger}] user={context.userId} {message}'
    }}
  }]
});
```

Include in JSON:

```ts
formatter: { name: 'json-formatter', options: {
  format: ['timestamp','level','logger','context.userId','message']
}}
```

Filter by context (deny wins):

```ts
{ name: 'match-filter', options: { deny: { 'context.env': 'test' } } }
```

Tips: keep context small and serializable; avoid secrets; set once for per-request/job loggers.

## Appenders

Built-in: `console`, `file` (Excluding browser). Configure per appender with optional local filters and priority. Details: `./doc/appenders.md`.

```ts
{ name: 'console', formatter: 'default-formatter' }
{ name: 'file', filename: 'app.log', formatter: 'json-formatter', priority: 10 }
```

## Formatters

- `default-formatter` (text templates, tokens, colors)
- `json-formatter` (one JSON line per event; selectable fields; pretty)

Docs: `./doc/formatters.md`.

## Filters

Global and per-appender filter chains. Built-in `match-filter` supports allow/deny using dot-paths. Docs: `./doc/filters.md`.

```ts
{ name: 'match-filter', options: { allow: { logger: 'app.db', level: 'debug' } } }
```

## Runtime Control

Enable/disable at runtime and flush.

```ts
Logging.disableAppender('console');
Logging.enableFilter('match-filter', 'file'); // just on the file appender
Logging.flushAppenders();
```

## Custom Plugins

Register your own appender/formatter/filter factories before `init()`.

```ts
import { Logging, PluginKind, type PluginFactory } from 'log-m8';

class MyAppenderFactory implements PluginFactory { /* ... */ }

Logging.registerPluginFactory(new MyAppenderFactory());
Logging.init(/* your config referencing the factory name */);
```

## API Documentation

- API reference: `./doc/api.md`
- Guides: `./doc/README.md` → configuration, appenders, formatters, filters

## Environment Compatibility

- Node.js >= 18 supported (tested with Node 24)
- Browser: console appender only; file appender is Node-only
- TypeScript types included; ESM and CJS entry points available

## License

BSD 2-Clause License.
