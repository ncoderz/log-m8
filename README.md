# log-m8

![Build & Test](https://github.com/ncoderz/log-m8/actions/workflows/build-test.yml/badge.svg?branch=main)
![npm version](https://img.shields.io/npm/v/@ncoderz/log-m8)
![License](https://img.shields.io/badge/license-BSD--2--Clause-blue)


A fast, small, flexible and extensible logging system for TypeScript and JavaScript applications.


## Features

- 🌲 **Hierarchical loggers** - organize by module with inheritance
- 🔌 **Plugin architecture** - extensible with custom appenders, formatters, and filters
- 🎨 **Multiple output targets** - console, file, and more with custom formatters
- 🔍 **Configurable filters** - control what gets logged and where
- 🚀 **Performance-optimized** - designed for minimal overhead
- 🌐 **Browser & Node.js support** - works in any JavaScript environment
- 📦 **ESM & CommonJS compatible** - use with any module system
- 💪 **Zero dependencies** - lightweight and fast (minified + gzipped ~6kB)

## Installation

```bash
npm install @ncoderz/log-m8
```

## Quick Start

```typescript
import { LogM8 } from '@ncoderz/log-m8';

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


### Hierarchical Loggers

Loggers are organized hierarchically using dot notation:

```typescript
const appLogger = LogM8.getLogger('app');
const dbLogger = LogM8.getLogger('app.database');
const cacheLogger = appLogger.getLogger('cache'); // 'app.cache'
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
      formatter: {
        name: 'default-formatter',
        format: ['{timestamp} {LEVEL} [{logger}]', '{message}', '{data}'],
        timestampFormat: 'yyyy-MM-dd hh:mm:ss.SSS',
        color: true
      },
      // Optional priority (higher runs first)
      priority: 100,
    },
    {
      name: 'file',
      filename: 'app.log',
      formatter: {
        name: 'json-formatter',
        format: ['timestamp', 'level', 'logger', 'message', 'data'],
        timestampFormat: 'iso',
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

- `timestamp`: Formatted timestamp
- `LEVEL`: Uppercase level label (Default Formatter Only. With standard padding, and optional colorization)
- `level`: Lowercase level name
- `logger`: Logger name
- `message`: Primary log message
- `data`: Additional data arguments
- `context.*`: Nested context properties

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

Provides allow/deny rules based on path-based equality or regex matching against log event properties.

```typescript
{
  name: 'match-filter',
  // Optional: all rules must match to allow (AND logic)
  allow: {
    'logger': '/^app.*$/',
    'data[0].type': 'audit'
  },
  // Optional: any match denies (OR logic)
  deny: {
    'context.userId': '1234',
    'message': '/.*password.*/'
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

### Adjusting log levels at runtime

You can change the effective logging thresholds without recreating loggers:

```typescript
// Set global log level gate (does not change individual logger levels)
LogM8.setLevel('info');

// Set a specific logger's level via manager (equivalent to getLogger(...).setLevel)
LogM8.setLevel('debug', 'app.database');

// Or use the logger instance directly
const alpha = LogM8.getLogger('alpha');
alpha.setLevel('warn');
```

Behavior rules:

- A message is emitted only if its level is enabled by BOTH the logger’s level and the global level.
- Think of the effective level as the stricter bound: effective = min(loggerLevel, globalLevel) in the level order
  (off < fatal < error < warn < info < debug < track < trace).

Example sequence:

```typescript
const warnLogger = LogM8.getLogger('alpha');
warnLogger.setLevel('warn');
const debugLogger = LogM8.getLogger('beta');
debugLogger.setLevel('debug');

// Global: info → beta logs info+, alpha logs warn+
LogM8.setLevel('info');

// Global: debug → beta logs debug+, alpha still logs warn+
LogM8.setLevel('debug');

// Global: info again → beta logs info+, alpha still logs warn+
LogM8.setLevel('info');
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
<script src="https://cdn.jsdelivr.net/npm/@ncoderz/log-m8@latest/dist/browser/log-m8.global.js"></script>
<script>
  const { LogM8 } = window.logM8;

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
