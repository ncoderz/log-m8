# log-m8

A lightweight, extensible logging library for TypeScript/JavaScript applications with hierarchical loggers, configurable appenders, and a flexible plugin system.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Hierarchical Loggers](#hierarchical-loggers)
- [Log Levels](#log-levels)
- [Built-in Appenders](#built-in-appenders)
- [Default Formatter (Text)](#default-formatter-text)
- [Json Formatter (Structured)](#json-formatter-structured)
- [Match Filter](#match-filter)
- [Filters Guide](#filters-guide)
- [Runtime Control](#runtime-control)
- [Custom Plugins](#custom-plugins)
- [API Documentation](#api-documentation)
- [Environment Compatibility](#environment-compatibility)

## Features

- **Hierarchical Loggers**: Organize loggers with dot-separated names (`app.database.queries`)
- **Configurable Log Levels**: Support for `off`, `fatal`, `error`, `warn`, `info`, `debug`, `track`, `trace`
- **Buffered Startup Logging**: Buffers up to 100 log events before initialization, then flushes them
- **Plugin System**: Extensible appenders, formatters, and filters via factory pattern
- **Built-in Appenders**: Console (Node.js/Browser) and File (Node.js) appenders included
- **Flexible Formatting**: Default text formatter with colors and custom templates; dedicated JSON formatter
- **Filtering**: Global and per-appender filters with allow/deny rules and runtime toggling
- **Runtime Control**: Enable/disable appenders and filters; flush operations at runtime
- **Minimal Dependencies**: Lightweight with a small dependency footprint

## Quick Start

```typescript
import { Logging } from 'log-m8';

// Initialize with default console output
Logging.init();

// Get a logger and start logging
const logger = Logging.getLogger('app');
logger.info('Application started');
logger.debug('Debug information', { userId: 123 });
```

CommonJS:

```js
// cjs
const { Logging } = require('log-m8');
Logging.init();
```

## Installation

```bash
npm install log-m8
```

## Configuration

### Basic Configuration

```typescript
import { Logging } from 'log-m8';

Logging.init({
  level: 'info', // Default level for all loggers
  loggers: {
    // Per-logger level overrides
    'app.database': 'debug',
    'app.auth': 'warn',
  },
  appenders: [
    {
      // Output destinations
      name: 'console',
      formatter: 'default',
    },
  ],
});
```

### Advanced Configuration

```typescript
Logging.init({
  level: 'info',
  loggers: {
    'app.database': 'debug',
    'app.performance': 'trace',
  },

  // Global filters (evaluated before any appender filters)
  filters: [
    { name: 'match-filter', deny: { 'context.userId': 'blocked' } },
    { name: 'sensitive-data', enabled: true },
  ],

  appenders: [
    {
      name: 'console',
      enabled: true,
      priority: 10, // Higher priority executes first
      formatter: {
        name: 'default',
        format: '{timestamp} {LEVEL} [{logger}] {message}',
        timestampFormat: 'hh:mm:ss.SSS',
        color: true,
      },
      // Appender-level filters (evaluated after global filters)
      filters: [
        'sensitive-data',
        { name: 'match-filter', allow: { logger: 'app.database' }, enabled: false }, // start disabled
      ],
    },
    {
      name: 'file',
      filename: 'app.log',
      append: true,
      formatter: {
  name: 'json-formatter', // Structured JSON output for file
  format: ['timestamp', 'level', 'logger', 'message', 'data'],
  timestampFormat: 'iso',
  pretty: 2,
      },
    },
  ],
});
```

## Hierarchical Loggers

Create organized logger hierarchies with dot-separated names:

```typescript
const app = Logging.getLogger('app');
const db = app.getLogger('database'); // Name: 'app.database'
const queries = db.getLogger('queries'); // Name: 'app.database.queries'

// Each logger can have independent configuration
db.setLevel('debug');
db.setContext({ service: 'postgres', pool: 'primary' });

queries.debug('SELECT * FROM users WHERE id = ?', [123]);
// Output: [timestamp] DEBUG [app.database.queries] SELECT * FROM users WHERE id = ? [123]
```

## Log Levels

Log levels in ascending order of verbosity:

- `off` - Disables all logging
- `fatal` - Critical system failures
- `error` - Operation failures
- `warn` - Potentially problematic situations
- `info` - General informational messages
- `debug` - Detailed diagnostic information
- `track` - Analytics/user behavior tracking
- `trace` - Most detailed execution information

```typescript
const logger = Logging.getLogger('app');

logger.setLevel('info');
logger.fatal('System is shutting down'); // Emitted
logger.error('Failed to connect to DB'); // Emitted
logger.warn('Connection pool nearly full'); // Emitted
logger.info('User logged in'); // Emitted
logger.debug('Cache hit ratio: 94%'); // NOT emitted (debug > info)
logger.track('user.click', { button: 'submit' }); // NOT emitted
```

## Built-in Appenders

### Console Appender

Outputs to the global console object with appropriate method mapping:

```typescript
{
  name: 'console',
  formatter: {
    name: 'default',
    color: true,                    // ANSI colors in Node.js, CSS in browser
    format: '{timestamp} {LEVEL} [{logger}] {message}'
  }
}
```

### File Appender (Node.js only)

Writes to files with configurable append/overwrite behavior:

```typescript
{
  name: 'file',
  filename: 'logs/app.log',
  append: true,                     // Append to existing file
  formatter: {
    name: 'default',
    json: true,                     // Structured JSON output
    timestampFormat: 'iso'
  }
}
```

## Default Formatter (Text)

The built-in text formatter provides readable output with extensive customization:

### Text Mode (Default)

```typescript
{
  name: 'default',
  format: '{timestamp} {LEVEL} [{logger}] {message}',
  timestampFormat: 'hh:mm:ss.SSS',
  color: true
}

// Output: 14:23:45.123 INFO  [app.auth] User authentication successful
```

## Json Formatter (Structured)

Use the JSON formatter for structured logs with size guards (depth, string, and array limits):

```typescript
{
  name: 'json-formatter',
  format: ['timestamp', 'level', 'logger', 'message', 'data'],
  timestampFormat: 'iso',
  pretty: 2,
  maxDepth: 3,
  maxStringLen: 1000,
  maxArrayLen: 100
}

// Output: {"timestamp":"2025-08-04T14:23:45.123Z","level":"info","logger":"app.auth","message":"User authenticated","data":{"userId":123}}
```

### Format Tokens

- `{timestamp}` - Formatted timestamp
- `{LEVEL}` - Uppercase level with optional colors
- `{level}` - Lowercase level name
- `{logger}` - Logger name
- `{message}` - Primary log message
- `{data}` - Additional data arguments
- `{context.*}` - Context properties (e.g., `{context.userId}`)

### Timestamp Formats

```typescript
// Presets
timestampFormat: 'iso'; // 2025-08-04T14:23:45.123Z
timestampFormat: 'locale'; // 8/4/2025, 2:23:45 PM

// Custom patterns
timestampFormat: 'yyyy-MM-dd hh:mm:ss'; // 2025-08-04 14:23:45
timestampFormat: 'hh:mm:ss.SSS'; // 14:23:45.123
timestampFormat: 'MM/dd/yyyy h:mm A'; // 08/04/2025 2:23 PM
```

Supported tokens: `yyyy`, `yy`, `MM`, `dd`, `hh`, `h`, `mm`, `ss`, `SSS`, `SS`, `S`, `A`, `a`, `z`, `zz`

## Match Filter

Built-in filter providing simple allow/deny rules with path-based matching.

### Configuration

```typescript
// Allow ALL rules to match (AND), then deny if ANY deny rule matches (OR)
{
  name: 'console',
  formatter: 'default',
  filters: [
    {
      name: 'match-filter',
      allow: {
        logger: 'allow.this.logger',
        'data[0].custom[3].path': 4
      },
      deny: {
        logger: 'block.this.logger',
        'context.userId': '1234'
      }
    }
  ]
}
```

### Semantics

- allow: If provided and non-empty, the event must satisfy ALL allow rules to pass.
- deny: If provided, the event is blocked if ANY deny rule matches.
- Precedence: deny overrides allow.

### Path Notation

- Dot paths: `context.userId`, `logger`, `level`
- Bracket indices: `data[0].custom[3].path`
- Path resolution is safe; missing paths yield `undefined` and won’t throw.

### Try it

```typescript
import { Logging } from 'log-m8';

Logging.init({
  level: 'debug',
  appenders: [
    {
      name: 'console',
      formatter: 'default',
      filters: [
        {
          name: 'match-filter',
          allow: { logger: 'demo', 'data[0].kind': 'ping' },
          deny: { 'context.userId': 'blocked' },
        },
      ],
    },
  ],
});

const log = Logging.getLogger('demo');
log.info('will be filtered out'); // no data => fails allow
log.info('allowed with data', { kind: 'ping' }); // passes allow

const withCtx = log.getLogger('ctx');
withCtx.setContext({ userId: 'blocked' });
withCtx.info('denied due to context', { kind: 'ping' }); // denied by rule
```

## Filters Guide

Looking for more on filters, the `enabled` flag, global vs appender filters, and runtime toggling? See the dedicated Filters Guide in doc/filters.md.

## Runtime Control

### Appender Management

```typescript
// Disable/enable appenders dynamically
Logging.disableAppender('console');
Logging.enableAppender('file');

// Force flush buffered output
Logging.flushAppender('file');
Logging.flushAppenders(); // Flush all appenders
```

### Filter Management

```typescript
// Toggle filters globally
Logging.disableFilter('sensitive-data');
Logging.enableFilter('match-filter');

// Toggle filters for a specific appender only
Logging.disableFilter('sensitive-data', 'console');
Logging.enableFilter('match-filter', 'console');
```

Notes:
- Appenders and filters default to enabled unless `enabled: false` is provided in config.
- Disabled filters are skipped during evaluation but their position in the order is preserved.

### Logger Context

```typescript
const logger = Logging.getLogger('api');

// Set context included with all log events
logger.setContext({
  requestId: 'req-123',
  userId: 456,
  sessionId: 'sess-789',
});

logger.info('Processing request');
// Output includes context automatically
```

## Custom Plugins

Extend the logging system with custom appenders, formatters, and filters:

### Custom Appender

```typescript
import { Appender, AppenderConfig, LogEvent, PluginKind } from 'log-m8';

class DatabaseAppender implements Appender {
  name = 'database';
  version = '1.0.0';
  kind = PluginKind.appender;
  supportedLevels = new Set(['error', 'fatal']);
  enabled = true;
  priority = 0;

  init(config: AppenderConfig) {
    // Initialize database connection
  }

  write(event: LogEvent) {
    // Insert log event into database
  }

  flush() {
    // Ensure all logs are persisted
  }

  dispose() {
    // Clean up resources
  }

  // Required by Appender interface; implement as needed
  enableFilter(_name: string): void {}
  disableFilter(_name: string): void {}
}

// Register before init()
Logging.registerPluginFactory(new DatabaseAppenderFactory());
```

### Custom Filter

```typescript
import { Filter, LogEvent, PluginKind } from 'log-m8';

class SensitiveDataFilter implements Filter {
  name = 'sensitive-data';
  version = '1.0.0';
  kind = PluginKind.filter;
  enabled = true; // Required by Filter interface

  init(): void {}

  filter(event: LogEvent): boolean {
    // Return false to skip events containing sensitive data
    const message = String(event.message ?? '');
    return !message.includes('password') && !message.includes('token');
  }

  dispose(): void {}
}
```

## Pre-initialization Buffering

Events logged before `init()` are automatically buffered and flushed:

```typescript
const logger = Logging.getLogger('app');

// These events are buffered (up to 100)
logger.info('Starting application');
logger.debug('Loading configuration');

// Initialize logging system
Logging.init({ level: 'info' });

// Buffered events are flushed on the first post-init log emission,
// then new events process normally
logger.info('Application ready'); // This triggers buffer flush + processes normally
```

## Error Handling

The logging system is designed to be resilient:

- Appender errors are caught and logged to console without stopping other appenders
- Missing plugin factories throw errors during `init()` for early detection
- Invalid configurations are handled gracefully with sensible defaults
- File I/O errors in file appender don't crash the application

## Performance Considerations

- **Disabled Logs**: O(1) performance check for disabled log levels
- **Synchronous Processing**: All logging operations are synchronous for predictable behavior
- **Buffer Management**: Pre-init buffer is capped at 100 events with FIFO eviction
- **Priority Ordering**: Appenders execute in descending priority order for deterministic output

## Lifecycle Management

```typescript
// Graceful shutdown
await new Promise((resolve) => {
  Logging.flushAppenders();
  setTimeout(() => {
    Logging.dispose(); // Clean up all resources
    resolve();
  }, 100);
});

// Can reinitialize after disposal
Logging.init({ level: 'warn' });
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import { Log, LogLevel, LoggingConfig } from 'log-m8';

const config: LoggingConfig = {
  level: LogLevel.info,
  appenders: [
    /* ... */
  ],
};

const logger: Log = Logging.getLogger('typed');
logger.info('Fully typed logging');
```

## API Documentation

For comprehensive API documentation including detailed method signatures, configuration options, and advanced usage patterns, see:

- **[Complete API Reference](doc/api.md)** - Detailed documentation of all classes, interfaces, and methods
- **[Specifications](spec/)** - Technical specifications and behavioral requirements

## Environment Compatibility

- **Node.js**: Full functionality including file appender and ANSI colors
- **Browser**: Console appender with CSS styling, no file operations
- **Automatic Detection**: Environment-specific features enabled automatically
 - Tested on Node.js 18+; ESM and CJS builds provided. TypeScript definitions included.

## License

BSD-2-Clause — see the LICENSE file for details.
