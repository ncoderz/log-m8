# log-m8 API Documentation

This document provides comprehensive API documentation for the log-m8 logging library.

## Table of Contents

- [Core Classes](#core-classes)
  - [LogM8](#logm8)
  - [Log (Logger Interface)](#log-logger-interface)
- [Configuration](#configuration)
  - [LoggingConfig](#loggingconfig)
  - [AppenderConfig](#appenderconfig)
  - [FormatterConfig](#formatterconfig)
  - [FilterConfig](#filterconfig)
- [Plugin System](#plugin-system)
  - [Plugin Interface](#plugin-interface)
  - [PluginFactory Interface](#pluginfactory-interface)
  - [PluginKind Enum](#pluginkind-enum)
- [Built-in Plugins](#built-in-plugins)
  - [ConsoleAppender](#consoleappender)
  - [FileAppender](#fileappender)
  - [DefaultFormatter](#defaultformatter)
- [Utilities](#utilities)
  - [LogM8Utils](#logm8utils)
  - [LogLevel Enum](#loglevel-enum)
- [Types](#types)
  - [LogEvent](#logevent)
  - [LogContext](#logcontext)

---

## Core Classes

### LogM8

Central logging manager that coordinates loggers, appenders, formatters, and filters.

#### Constructor

```typescript
new LogM8()
```

Creates a new LogM8 instance with built-in plugin factories pre-registered.

#### Methods

##### `init(config?: LoggingConfig): void`

Initializes the logging system with configuration.

**Parameters:**
- `config` - Optional logging configuration object

**Throws:**
- `Error` when referenced plugin factories are not registered

**Example:**
```typescript
Logging.init({
  level: 'info',
  loggers: { 'app.database': 'debug' },
  appenders: [{ name: 'console', formatter: 'default' }]
});
```

##### `dispose(): void`

Shuts down logging system and releases all resources.

**Example:**
```typescript
Logging.dispose();
```

##### `getLogger(name: string | string[]): Log`

Retrieves or creates a logger instance with hierarchical naming.

**Parameters:**
- `name` - Logger name as string or array of segments

**Returns:** Logger instance for the specified name

**Example:**
```typescript
const logger1 = Logging.getLogger('app.database');
const logger2 = Logging.getLogger(['app', 'database']);
// logger1 === logger2 (same instance)
```

##### `enableAppender(name: string): void`

Enables an appender to resume processing log events.

**Parameters:**
- `name` - Name of appender to enable

##### `disableAppender(name: string): void`

Disables an appender to stop processing log events.

**Parameters:**
- `name` - Name of appender to disable

##### `flushAppender(name: string): void`

Forces an appender to flush any buffered output.

**Parameters:**
- `name` - Name of appender to flush

##### `flushAppenders(): void`

Flushes all configured appenders.

##### `registerPluginFactory(pluginFactory: PluginFactory): void`

Registers a custom plugin factory.

**Parameters:**
- `pluginFactory` - Factory instance implementing PluginFactory interface

**Example:**
```typescript
Logging.registerPluginFactory(new CustomAppenderFactory());
```

---

### Log (Logger Interface)

Interface for hierarchical logger instances providing level-based logging methods.

#### Properties

##### `name: string` (readonly)

The dot-separated hierarchical name of this logger instance.

##### `level: LogLevelType` (readonly)

The current logging level determining which events are emitted.

##### `context: LogContext` (readonly)

Contextual data automatically included with all log events from this logger.

##### Level Flags (readonly)

- `isFatal: boolean` - True when logger's current level equals 'fatal'
- `isError: boolean` - True when logger's current level equals 'error'
- `isWarn: boolean` - True when logger's current level equals 'warn'
- `isInfo: boolean` - True when logger's current level equals 'info'
- `isDebug: boolean` - True when logger's current level equals 'debug'
- `isTrace: boolean` - True when logger's current level equals 'trace'
- `isTrack: boolean` - True when logger's current level equals 'track'
- `isEnabled: boolean` - True when logging is enabled (false only when level is 'off')

**Note:** These flags indicate enablement for that severity level and above.

#### Methods

##### Logging Methods

```typescript
fatal(message: string | unknown, ...data: unknown[]): void
error(message: string | unknown, ...data: unknown[]): void
warn(message: string | unknown, ...data: unknown[]): void
info(message: string | unknown, ...data: unknown[]): void
debug(message: string | unknown, ...data: unknown[]): void
trace(message: string | unknown, ...data: unknown[]): void
track(message: string | unknown, ...data: unknown[]): void
```

Each method logs a message at the corresponding severity level.

**Parameters:**
- `message` - Primary message or serializable object to log
- `data` - Additional context data to include with the log event

**Example:**
```typescript
logger.info('User logged in', { userId: 123, timestamp: Date.now() });
logger.error('Database connection failed', { host: 'localhost', port: 5432 });
```

##### `setLevel(level: string): void`

Updates the logger's severity level threshold.

**Parameters:**
- `level` - New logging level name (e.g., 'info', 'debug', 'off')

##### `setContext(context: LogContext): void`

Replaces the logger's contextual data.

**Parameters:**
- `context` - New context object to associate with this logger

##### `getLogger(name: string): Log`

Creates or retrieves a child logger with hierarchical naming.

**Parameters:**
- `name` - Name segment for the child logger

**Returns:** Child logger instance with name 'parent.child'

---

## Configuration

### LoggingConfig

Main configuration object for initializing the logging system.

```typescript
interface LoggingConfig {
  level?: string;                    // Default log level for all loggers
  loggers?: Record<string, string>;  // Per-logger level overrides by name
  appenders?: AppenderConfig[];      // Appender configurations
}
```

**Example:**
```typescript
const config: LoggingConfig = {
  level: 'info',
  loggers: {
    'app.database': 'debug',
    'app.security': 'warn'
  },
  appenders: [
    { name: 'console', formatter: 'default' },
    { name: 'file', filename: 'app.log' }
  ]
};
```

### AppenderConfig

Configuration for appender instances.

```typescript
interface AppenderConfig extends PluginConfig {
  enabled?: boolean;                 // Enable/disable appender
  priority?: number;                 // Execution priority (higher = first)
  formatter?: string | FormatterConfig; // Formatter name or config
  filters?: (string | FilterConfig)[]; // Filter names or configs
}
```

### FormatterConfig

Base configuration for formatter plugins.

```typescript
interface FormatterConfig extends PluginConfig {
  // Additional formatter-specific options in options property
}
```

### FilterConfig

Base configuration for filter plugins.

```typescript
interface FilterConfig extends PluginConfig {
  // Additional filter-specific options in options property
}
```

---

## Plugin System

### Plugin Interface

Base interface for all plugin types.

```typescript
interface Plugin {
  name: string;          // Plugin name for factory lookup
  version: string;       // Plugin version
  kind: PluginKindType;  // Plugin type (appender, formatter, filter)

  dispose(): void;       // Cleanup method called during shutdown
}
```

### PluginFactory Interface

Factory interface for creating plugin instances.

```typescript
interface PluginFactory<TConfig = PluginConfig, TPlugin = Plugin> {
  name: string;          // Factory name for registration
  version: string;       // Factory version
  kind: PluginKindType;  // Type of plugins this factory creates

  create(config: TConfig): TPlugin; // Creates plugin instance
}
```

### PluginKind Enum

Enumeration of supported plugin types.

```typescript
enum PluginKind {
  appender = 'appender',
  formatter = 'formatter',
  filter = 'filter'
}
```

---

## Built-in Plugins

### ConsoleAppender

Built-in appender that outputs to the global console object.

#### Configuration

```typescript
interface ConsoleAppenderConfig extends AppenderConfig {
  // No additional options - uses base AppenderConfig
}
```

#### Features

- Maps log levels to appropriate console methods
- Fallback to console.log for missing methods
- Automatic console availability detection
- Zero-configuration operation

#### Example

```typescript
{
  name: 'console',
  enabled: true,
  priority: 10,
  formatter: {
    name: 'default',
    color: true
  }
}
```

### FileAppender

Node.js-only appender that writes to files.

#### Configuration

```typescript
interface FileAppenderConfig extends AppenderConfig {
  filename: string;      // Path to log file
  append?: boolean;      // Append to existing file (default: true)
}
```

#### Example

```typescript
{
  name: 'file',
  filename: 'logs/application.log',
  append: true,
  formatter: {
    name: 'default',
    json: true,
    timestampFormat: 'iso'
  }
}
```

### DefaultFormatter

Built-in formatter supporting text and JSON output with extensive customization.

#### Configuration

```typescript
interface DefaultFormatterConfig extends FormatterConfig {
  format?: string | string[];     // Custom format template(s)
  timestampFormat?: string;       // Timestamp format pattern or preset
  color?: boolean;                // Enable colorized output
  json?: boolean;                 // Switch to JSON output mode
}
```

#### Format Tokens

- `{timestamp}` - Formatted timestamp
- `{LEVEL}` - Uppercase level with optional colors
- `{level}` - Lowercase level name
- `{logger}` - Logger name
- `{message}` - Primary log message
- `{data}` - Additional data arguments
- `{context.*}` - Context properties (e.g., `{context.userId}`)

#### Text Mode Example

```typescript
{
  name: 'default',
  format: '{timestamp} {LEVEL} [{logger}] {message}',
  timestampFormat: 'hh:mm:ss.SSS',
  color: true
}
```

#### JSON Mode Example

```typescript
{
  name: 'default',
  json: true,
  format: ['{timestamp}', '{level}', '{logger}', '{message}', '{data}'],
  timestampFormat: 'iso'
}
```

---

## Utilities

### LogM8Utils

Utility class providing timestamp formatting and object property access.

#### Static Methods

##### `isBrowser(): boolean`

Detects browser environment for feature compatibility.

**Returns:** True when both window and document objects are available

##### `getPropertyByPath(obj: unknown, path: string): unknown`

Traverses nested object properties using dot-separated path notation.

**Parameters:**
- `obj` - Source object to traverse
- `path` - Dot-separated property path

**Returns:** Property value at path, or undefined if not found

**Example:**
```typescript
const data = { user: { profile: { name: 'John' } }, items: [{ id: 1 }] };
LogM8Utils.getPropertyByPath(data, 'user.profile.name'); // 'John'
LogM8Utils.getPropertyByPath(data, 'items.0.id');        // 1
```

##### `formatTimestamp(date: Date, fmt?: string): string`

Formats Date objects using preset formats or custom token patterns.

**Parameters:**
- `date` - Date instance to format
- `fmt` - Format preset ('iso'|'locale') or custom token pattern

**Returns:** Formatted timestamp string

**Supported Tokens:**
- `yyyy` - 4-digit year (2025)
- `yy` - 2-digit year (25)
- `MM` - Month with leading zero (01-12)
- `dd` - Day with leading zero (01-31)
- `hh` - 24-hour format hour (00-23)
- `h` - 12-hour format hour (1-12)
- `mm` - Minutes with leading zero (00-59)
- `ss` - Seconds with leading zero (00-59)
- `SSS` - Milliseconds (000-999)
- `SS` - Centiseconds (00-99)
- `S` - Deciseconds (0-9)
- `A` - Uppercase AM/PM
- `a` - Lowercase am/pm
- `z` - Timezone offset with colon (±HH:MM)
- `zz` - Timezone offset without colon (±HHMM)

**Example:**
```typescript
const date = new Date('2025-08-04T14:23:45.123Z');
LogM8Utils.formatTimestamp(date, 'yyyy-MM-dd hh:mm:ss'); // '2025-08-04 14:23:45'
LogM8Utils.formatTimestamp(date, 'hh:mm:ss.SSS');        // '14:23:45.123'
```

### LogLevel Enum

Enumeration of supported log severity levels in ascending order of verbosity.

```typescript
enum LogLevel {
  off = 'off',       // Disables all logging
  fatal = 'fatal',   // Critical system failures
  error = 'error',   // Operation failures
  warn = 'warn',     // Potentially problematic situations
  info = 'info',     // General informational messages
  debug = 'debug',   // Detailed diagnostic information
  track = 'track',   // Analytics and behavior tracking
  trace = 'trace'    // Most detailed execution information
}
```

Events are emitted when their level index is <= logger's level index.

---

## Types

### LogEvent

Structure representing a single log entry.

```typescript
interface LogEvent {
  logger: string;        // Name of the logger that created the event
  level: LogLevelType;   // Severity level of the event
  message: unknown;      // Primary message or object to log
  data: unknown[];       // Additional data arguments
  context: LogContext;   // Logger's context at time of event
  timestamp: Date;       // Event creation timestamp
}
```

### LogContext

Contextual data associated with logger instances.

```typescript
interface LogContext {
  [key: string]: unknown; // Arbitrary key-value pairs
}
```

**Example:**
```typescript
const context: LogContext = {
  requestId: 'req-123',
  userId: 456,
  sessionId: 'sess-789',
  correlationId: 'corr-abc'
};
```

---

## Usage Patterns

### Basic Logging

```typescript
import { Logging } from 'log-m8';

Logging.init();
const logger = Logging.getLogger('app');
logger.info('Application started');
```

### Hierarchical Organization

```typescript
const api = Logging.getLogger('api');
const auth = api.getLogger('auth');       // 'api.auth'
const users = auth.getLogger('users');    // 'api.auth.users'

users.setContext({ service: 'user-management' });
users.debug('User validation completed');
```

### Multiple Appenders

```typescript
Logging.init({
  level: 'info',
  appenders: [
    {
      name: 'console',
      formatter: { name: 'default', color: true }
    },
    {
      name: 'file',
      filename: 'logs/app.log',
      formatter: { name: 'default', json: true }
    }
  ]
});
```

### Custom Plugin

```typescript
class DatabaseAppender implements Appender {
  name = 'database';
  version = '1.0.0';
  kind = PluginKind.appender;
  supportedLevels = new Set(['error', 'fatal']);
  enabled = true;

  init(config: AppenderConfig) {
    // Initialize database connection
  }

  write(event: LogEvent) {
    // Store event in database
  }

  flush() {
    // Ensure persistence
  }

  dispose() {
    // Clean up resources
  }
}

Logging.registerPluginFactory(new DatabaseAppenderFactory());
```

---

For more examples and usage patterns, see the [main README](../README.md) and [specifications](../spec/).
