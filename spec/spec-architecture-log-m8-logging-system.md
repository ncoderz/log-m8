---
title: Log-M8 High-Performance Pluggable Logging System Architecture
version: 1.0
date_created: 2025-08-01
last_updated: 2025-08-01
owner: ncoderz
tags: [architecture, logging, performance, typescript, javascript, pluggable]
---

# Introduction

Log-M8 is a high-performance, pluggable logging system designed for TypeScript and JavaScript applications. The system prioritizes code conciseness, exceptional performance, and extensibility through a robust plugin architecture. This specification defines the core architecture, interfaces, and requirements for building a logging system that can handle high-throughput scenarios while maintaining simplicity and flexibility.

## 1. Purpose & Scope

This specification defines the architectural requirements and design constraints for the Log-M8 logging system. The system is intended for use in production TypeScript/JavaScript applications ranging from small utilities to high-scale distributed systems.

**Target Audience**: AI Tools, TypeScript/JavaScript developers, DevOps engineers, and system architects implementing logging solutions.

**Assumptions**:
- Node.js runtime environment (≥18.0.0)
- TypeScript or JavaScript development environment
- Understanding of asynchronous programming patterns
- Familiarity with structured logging concepts

## 2. Definitions

- **Logger**: Core logging interface that accepts and processes log messages
- **Appender**: Output destination for log messages (console, file, network, etc.)
- **Formatter**: Component responsible for transforming log data into specific output formats
- **Filter**: Component that determines whether a log message should be processed
- **Log Level**: Severity classification for log messages (DEBUG, INFO, WARN, ERROR, FATAL)
- **Log Context**: Additional metadata associated with log messages
- **Plugin**: Extensible component that adds functionality to the logging system
- **Async Batching**: Performance optimization technique that groups log operations
- **Zero-Copy Operations**: Memory-efficient operations that avoid unnecessary data duplication

## 3. Requirements, Constraints & Guidelines

### Performance Requirements
- **REQ-001**: Log message processing must complete in <1ms for 95% of operations
- **REQ-002**: Memory allocation per log message must not exceed 512 bytes during steady state
- **REQ-003**: System must support >100,000 log messages per second on standard hardware
- **REQ-004**: Async batching must be implemented for I/O operations to prevent blocking
- **REQ-005**: Zero-copy operations must be used where possible to minimize memory overhead

### Functional Requirements
- **REQ-006**: Support standard log levels (TRACE, TRACK, DEBUG, INFO, WARN, ERROR, FATAL)
- **REQ-007**: Enable structured logging with JSON output format
- **REQ-008**: Provide contextual logging with hierarchical context inheritance
- **REQ-009**: Support multiple simultaneous appenders with independent configurations
- **REQ-010**: Enable runtime log level configuration without application restart
- **REQ-011**: Provide correlation ID support for request tracking
- **REQ-012**: Support custom metadata fields in log messages
- **REQ-013**: Implement a 'Level to Appender' cache system to efficiently look up registered appenders based on log levels

### Plugin Architecture Requirements
- **REQ-014**: Plugin system must support runtime registration and deregistration
- **REQ-015**: Plugins must be able to extend formatters, appenders, and filters
- **REQ-016**: Plugin API must be type-safe with full TypeScript support
- **REQ-017**: Plugin lifecycle management (initialize, configure, dispose) must be standardized
- **REQ-018**: Plugin dependencies and conflicts must be managed automatically

### Code Quality Requirements
- **REQ-019**: API surface must be minimal and intuitive (≤10 primary methods)
- **REQ-020**: Core library size must be ≤50KB uncompressed
- **REQ-021**: Zero external runtime dependencies for core functionality except @ncoderz/superenum
- **REQ-022**: Tree-shaking support for unused features

### Security Requirements
- **SEC-001**: Sensitive data must be automatically masked or redacted in logs
- **SEC-002**: Log injection attacks must be prevented through input sanitization
- **SEC-003**: Plugin security isolation must prevent malicious plugins from accessing system resources

### Compatibility Requirements
- **COM-001**: Support Node.js ESM and CommonJS module systems
- **COM-002**: Browser compatibility for client-side logging scenarios
- **COM-003**: TypeScript type definitions must be included and accurate

### Constraints
- **CON-001**: Maximum call stack depth of 10 levels to prevent performance degradation
- **CON-002**: Synchronous operations limited to <100μs execution time
- **CON-003**: Memory usage must not grow unbounded during normal operation
- **CON-004**: Plugin registration must not impact existing logger performance

### Guidelines
- **GUD-001**: Prefer composition over inheritance in plugin design
- **GUD-002**: Use lazy initialization for expensive operations
- **GUD-003**: Implement graceful degradation when appenders fail
- **GUD-004**: Provide clear error messages with actionable guidance

### Patterns
- **PAT-001**: Factory pattern for logger creation and configuration
- **PAT-002**: Strategy pattern for pluggable formatters and appenders
- **PAT-003**: Observer pattern for log event notifications
- **PAT-004**: Builder pattern for complex configuration scenarios

## 4. Interfaces & Data Contracts

### Core LogM8 Interface

```typescript
interface LogM8 {
  configure(config: LoggingConfig): void;

  getLoggerLevel(level: LogLevel, name?: string);
  setLoggerLevel(level: LogLevel, name?: string);

  enableAppender(name: string);
  disableAppender(name: string);

  enableAsync();
  disableAsync();

  registerPlugin(plugin: Plugin);
}

interface LoggingConfig {
  level: LogLevel;
  loggers: {
    [key: string]: LogLevel | boolean;
  }
  appenders: AppenderConfig[];
  asyncBuffering?: {
    enabled: boolean;
    messageCount: number;
    timeout: number;
  }
}
```

### Log Interface

```typescript
import type { EnumType } from '@ncoderz/superenum';

interface Log {
  fatal(...data: any[]): void;
  error(...data: any[]): void;
  warn(...data: any[]): void;
  info(...data: any[]): void;
  debug(...data: any[]): void;
  trace(...data: any[]): void;
  track(...data: any[]): void;

  isFatal(): boolean;
  isError(): boolean;
  isWarn(): boolean;
  isInfo(): boolean;
  isDebug(): boolean;
  isTrace(): boolean;
  isTrack(): boolean;

  getLogger(name: string, context: LogContext): Log;
}

interface LogContext {
  [key: string]: any;
  userId?: string;
  requestId?: string;
  correlationId?: string;
}

const LogLevel = {
  FATAL: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  TRACE: 5,
  TRACK: 6, // Special log level for analytics
} as const;

type LogLevel = EnumType<typeof LogLevel>;
```

### Plugin System Interface

```typescript
const PluginKind = {
  appender: 'appender'
} as const

type PluginKind = EnumType<typeof PluginKind>;

interface Plugin {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: string[];

  initialize(config: PluginConfig): Promise<void>;
  configure(config: PluginConfig): Promise<void>;
  dispose(): Promise<void>;
}

interface Appender extends Plugin {
  write(logEvent: LogEvent): Promise<void>;
  flush(): Promise<void>;
}

interface Formatter extends Plugin {
  format(logEvent: LogEvent): string;
}

interface Filter extends Plugin {
  shouldLog(logEvent: LogEvent): boolean;
}
```

### Log Event Data Contract

```typescript
interface LogEvent {
  readonly timestamp: Date;
  readonly level: LogLevel;
  readonly message: any;
  readonly data: any[];
  readonly context: LogContext;
  readonly logger: string;
}
```

### Configuration Schema

```typescript

interface PluginConfig {
  name: string;
  [key: string]: any; // Additional plugin-specific settings
}

interface AppenderConfig extends PluginConfig {
  type: string; // e.g., 'console', 'file', 'network'
  supportedLevels?: string[]
  formatter: FormatterConfig; // Each appender registers a single formatter
  filters?: FilterConfig[]; // Sequential filter chain specific to this appender
}

interface FormatterConfig extends PluginConfig {
  type: string; // e.g., 'json', 'text'
  cache?: boolean; // Indicates whether the formatter should cache its formatting
}

interface FilterConfig  extends PluginConfig{
  type: string; // e.g., 'level', 'context'
  appenders?: string[]; // List of appender names this filter forwards logs to. Empty or undefined means all appenders.
}


```

## 5. Acceptance Criteria

- **AC-001**: Given a logger instance, When a log message is created, Then it must be processed and output within 1ms for 95% of operations
- **AC-002**: Given multiple appenders are configured, When a log event occurs, Then all active appenders must receive the event independently
- **AC-003**: Given a plugin is registered at runtime, When the plugin is activated, Then existing loggers must not experience performance degradation
- **AC-004**: Given sensitive data in log context, When the log is formatted, Then sensitive fields must be automatically masked
- **AC-005**: Given async batching is enabled, When multiple log events occur rapidly, Then they must be batched and flushed according to configuration
- **AC-006**: Given a child logger is created, When it logs a message, Then it must inherit parent context while allowing override
- **AC-007**: Given memory usage monitoring, When the system processes 1M log messages, Then memory usage must not exceed baseline + 10MB
- **AC-008**: Given browser environment, When the logger is imported, Then it must function without Node.js-specific dependencies
- **AC-009**: Given log level is set to WARN, When DEBUG or INFO messages are logged, Then they must be filtered out without processing overhead
- **AC-010**: Given correlation ID in context, When logs are output, Then the correlation ID must be present in all related log entries
- **AC-011**: Given an appender with `async` enabled, When log events are processed, Then the appender must handle them asynchronously without blocking the main thread
- **AC-012**: Given an appender with `async` disabled, When log events are processed, Then the appender must handle them synchronously

## 6. Test Automation Strategy

- **Test Levels**: Unit (isolated component testing), Integration (plugin interaction testing), End-to-End (full system scenarios), Performance (throughput and latency testing)
- **Frameworks**: Vitest for unit and integration tests, custom performance harness for benchmarking
- **Test Data Management**: Synthetic log data generation with configurable patterns, automatic cleanup of test artifacts
- **CI/CD Integration**: Automated testing in GitHub Actions with performance regression detection
- **Coverage Requirements**: 95% code coverage for core functionality, 85% for plugin interfaces
- **Performance Testing**: Continuous benchmarking with alerts for >5% performance regression

## 7. Rationale & Context

### Performance Focus
The logging system is designed for high-throughput scenarios where traditional logging frameworks become bottlenecks. By implementing async batching, zero-copy operations, and minimal object allocation, the system can handle enterprise-scale logging requirements without impacting application performance.

### Plugin Architecture Decision
A plugin-based architecture was chosen to balance simplicity with extensibility. The core system remains lightweight while allowing advanced functionality through plugins. This approach enables tree-shaking of unused features and customization for specific deployment scenarios.

### TypeScript-First Design
TypeScript is the primary development target to provide compile-time safety and excellent developer experience. The type system helps prevent common logging errors and enables better IDE support.

### Zero External Dependencies
The core system has no external runtime dependencies to minimize security surface area, reduce bundle size, and eliminate version conflicts in consuming applications.

## 8. Dependencies & External Integrations

### Technology Platform Dependencies

- **PLT-001**: Node.js runtime ≥20.0.0 - Required for ESM support and modern JavaScript features
- **PLT-002**: TypeScript compiler ≥5.0.0 - Required for type checking and code generation during development
- **PLT-003**: Modern JavaScript engines supporting ES2022 - Required for performance optimizations
- **PLT-004**: @ncoderz/superenum - Required for type-safe enum-like constants with erasable syntax

### Infrastructure Dependencies

- **INF-001**: High-resolution timer support - Required for performance measurements and batching intervals
- **INF-002**: Async I/O capabilities - Required for non-blocking appender operations
- **INF-003**: Memory management with GC - Required for efficient object lifecycle management

### Data Dependencies

- **DAT-001**: System clock - Required for accurate timestamp generation
- **DAT-002**: Process environment variables - Required for runtime configuration

### Compliance Dependencies

- **COM-001**: GDPR compliance for data protection - Impact on sensitive data handling and retention policies

## 9. Examples & Edge Cases

```typescript
// Basic usage example
import { createLogger } from 'log-m8';

const logger = createLogger({
  level: LogLevel.INFO,
  appenders: [
    { type: 'console', format: 'json' },
    { type: 'file', path: './app.log', format: 'text' }
  ]
});

// Console.log style logging
logger.info('User login successful', 'userId:', '12345', 'correlationId:', 'abc-def-ghi');
logger.error('Database connection failed', new Error('Connection timeout'));
logger.debug('Processing request', { userId: '12345', action: 'login' });

// Child logger with inherited context
const requestLogger = logger.child({
  requestId: 'req-789',
  endpoint: '/api/users'
});

// Plugin registration
import { FileRotationPlugin } from 'log-m8-plugins';

logger.registerPlugin(new FileRotationPlugin({
  maxFileSize: '100MB',
  maxFiles: 5,
  rotationPattern: 'daily'
}));

// Performance-critical scenario
const highThroughputLogger = createLogger({
  level: LogLevel.INFO,
  performance: {
    batchSize: 1000,
    flushInterval: 100,
    enableAsyncMode: true
  }
});

// Edge case: Circular reference handling
const circularObj = { name: 'test' };
circularObj.self = circularObj;
logger.info('Circular reference test', circularObj);
// Should automatically detect and handle circular references

// Edge case: Large context object
const largeContext = {
  data: new Array(10000).fill('large string content'),
  nested: { deep: { very: { deep: 'value' } } }
};
logger.info('Large context test', largeContext);
// Should handle large objects efficiently without memory issues

// Edge case: High-frequency logging
for (let i = 0; i < 100000; i++) {
  logger.debug(`High frequency log ${i}`, 'iteration:', i);
}
// Should maintain performance and not cause memory leaks
```

## 10. Validation Criteria

- **Performance benchmarks meet all specified thresholds (REQ-001 through REQ-005)**
- **All functional requirements are implemented and tested (REQ-006 through REQ-012)**
- **Plugin system supports all required extension points (REQ-013 through REQ-017)**
- **Code quality metrics meet size and complexity constraints (REQ-018 through REQ-021)**
- **Security requirements are validated through penetration testing (SEC-001 through SEC-003)**
- **Compatibility testing passes on all supported platforms (COM-001 through COM-003)**
- **Memory usage remains within specified bounds during stress testing**
- **Type safety is verified through TypeScript strict mode compilation**
- **Performance regression testing shows no degradation >5% between versions**

## 11. Related Specifications / Further Reading

- [TypeScript Coding Standards](/Users/rich/dev/ncoderz/git/log-m8/.github/instructions/typescript.instructions.md)
- [Structured Logging Best Practices](https://www.elastic.co/guide/en/ecs/current/index.html)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- [JSON Logging Standard RFC 7464](https://tools.ietf.org/html/rfc7464)
- [Observability Standards](https://opentelemetry.io/docs/concepts/observability-primer/)
