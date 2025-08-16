# log-m8

A flexible, extensible logging system for TypeScript and JavaScript applications.

[![License](https://img.shields.io/badge/license-BSD--2--Clause-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/log-m8.svg)](https://www.npmjs.com/package/@ncoderzlog-m8)

## Features

- 🌲 **Hierarchical loggers** - organize by module with inheritance
- 🔌 **Plugin architecture** - extensible with custom appenders, formatters, and filters
- 🎨 **Multiple output targets** - console, file, and more with custom formatters
- 🔍 **Configurable filters** - control what gets logged and where
- 🚀 **Performance-optimized** - designed for minimal overhead
- 🌐 **Browser & Node.js support** - works in any JavaScript environment
- 📦 **ESM & CommonJS compatible** - use with any module system
- 💪 **Zero dependencies** - lightweight and fast

## Installation

```bash
npm install log-m8
```

## Quick Start

```typescript
import { LogM8 } from 'log-m8';

// Configure the logging system
LogM8.init();

// Get a logger
const logger = LogM8.getLogger('app.service');

// Log at various levels
logger.info('Service started');
logger.debug('Connection details:', { host: 'localhost', port: 3000 });
logger.error('Failed to connect', new Error('Connection refused'));

// Use context for structured logging
logger.setContext({ service: 'authentication', instance: 1 });
logger.warn('Rate limit exceeded');

// Child loggers inherit parent settings but can be configured separately
const dbLogger = logger.getLogger('database');  // app.service.database
dbLogger.setLevel('debug');
```

## Core Concepts

### Logging Levels

Log-m8 provides multiple logging levels in ascending order of verbosity:

| Level | Description |
|-------|-------------|
| `off` | Disables all logging |
| `fatal` | Critical system failures requiring immediate intervention |
| `error` | Failures preventing normal operation |
| `warn` | Potentially problematic situations |
| `info` | General informational messages about normal operation |
| `debug` | Detailed diagnostic information for development |
| `track` | Analytics and user behavior tracking events |
| `trace` | Most detailed execution information for fine-grained debugging |

When a logger is set to a specific level, it emits events at that level and all levels above it in the list. For example, a logger set to `info` will emit `fatal`, `error`, `warn`, and `info` events, but not `debug`, `track`, or `trace` events.

### Hierarchical Loggers

Loggers are organized hierarchically using dot notation:

```typescript
const appLogger = LogM8.getLogger('app');
const dbLogger = LogM8.getLogger('app.database');
const cacheLogger = LogM8.getLogger('app.cache');
```

This allows you to configure logging granularly by component while maintaining a clean organizational structure.

## Configuration

The `LogM8.init()` method configures the logging system:

```typescript
LogM8.init({
  // Default log level for all loggers (defaults to 'info')
  level: 'info',

  // Per-logger level overrides
  loggers: {
    'app.database': 'debug',
    'app.service': 'warn'
  },

  // Appender configurations
  appenders: [
    {
      name: 'console',
      formatter: 'default-formatter',
      // Optional priority (higher runs first)
      priority: 100
    },
    {
      name: 'file',
      filename: 'app.log',
      formatter: {
        name: 'default-formatter',
        timestampFormat: 'yyyy-MM-dd hh:mm:ss.SSS',
        color: false
      }
    }
  ],

  // Global filters
  filters: [
    {
      name: 'match-filter',
      deny: { 'context.sensitive': true }
    }
  ]
});
```

## Appenders

Appenders are responsible for outputting log events to specific destinations.

### Built-in Appenders

#### Console Appender

Outputs log events to the console, mapping log levels to the appropriate console methods.

```typescript
{
  name: 'console',
  // Optional formatter configuration
  formatter: 'default-formatter',
  // Optional per-appender filters
  filters: ['sensitive-data']
}
```

#### File Appender

Writes log events to a file, one line per event.

```typescript
{
  name: 'file',
  filename: 'app.log',
  // Optional: append to existing file (default: false)
  append: true,
  formatter: 'json-formatter'
}
```

## Formatters

Formatters transform log events into output formats suitable for different appenders.

### Supported Formatter Tokens

- `{timestamp}`: Formatted timestamp
- `{LEVEL}`: Uppercase level label (with optional colorization)
- `{level}`: Lowercase level name
- `{logger}`: Logger name
- `{message}`: Primary log message
- `{data}`: Additional data arguments
- `{context.*}`: Nested context properties

All tokens support accessing nested items with `data[0].property` like notation.

### Built-in Formatters

#### Default Formatter

A human-readable text formatter with customizable templates and optional colorized output.

```typescript
{
  name: 'default-formatter',
  // Optional: custom format with token placeholders
  format: ['{timestamp} {LEVEL} [{logger}]', '{message}', '{data}'],
  // Optional: timestamp format ('iso', 'locale', or custom pattern)
  timestampFormat: 'hh:mm:ss.SSS',
  // Optional: colorize level labels
  color: true
}
```


#### JSON Formatter

Formats log events as JSON objects, useful for machine processing and log aggregation.

```typescript
{
  name: 'json-formatter',
  // Optional fields to include
  format: ['timestamp', 'level', 'logger', 'message', 'data', 'context'],
  // Pretty print
  pretty: true
}
```

## Filters

Filters control which log events are processed by appenders.

### Supported Filter Tokens

See Supported Formatter Tokens.

### Built-in Filters

#### Match Filter

Provides allow/deny rules based on path-based matching against log event properties.

```typescript
{
  name: 'match-filter',
  // Optional: all rules must match to allow (AND logic)
  allow: {
    'logger': 'app.service',
    'data[0].type': 'audit'
  },
  // Optional: any match denies (OR logic)
  deny: {
    'context.userId': '1234',
    'message': 'password'
  }
}
```

## Runtime Control

Log-m8 provides methods for controlling appenders and filters at runtime:

```typescript
// Disable console appender (e.g., in production)
LogM8.disableAppender('console');

// Enable file appender
LogM8.enableAppender('file');

// Flush all appenders
LogM8.flushAppenders();

// Disable a filter for a specific appender
LogM8.disableFilter('sensitive-data', 'console');

// Enable a filter for a specific appender
LogM8.enableFilter('sensitive-data', 'console');

```

## Extending with Custom Plugins

You can extend log-m8 with custom appenders, formatters, and filters.

For example:

```typescript
class SlackAppenderFactory implements PluginFactory {
  name = 'slack';
  kind = PluginKind.appender;

  create(config) {
    return new SlackAppender(config);
  }
}

// Register before initialization
LogM8.registerPluginFactory(new SlackAppenderFactory());

// Use in configuration
LogM8.init({
  appenders: [
    {
      name: 'slack',
      webhookUrl: 'https://hooks.slack.com/...',
      channel: '#alerts'
    }
  ]
});
```

## Browser Usage

Log-m8 works in browsers with automatic environment detection:

```html
<script src="https://cdn.jsdelivr.net/npm/log-m8/dist/browser/log-m8.global.js"></script>
<script>
  const { LogM8 } = window.LogM8;

  LogM8.init({
    level: 'info',
    appenders: [{ name: 'console', formatter: 'default-formatter' }]
  });

  const logger = LogM8.getLogger('app');
  logger.info('Application started');
</script>
```

## License

[BSD-2-Clause](LICENSE)
