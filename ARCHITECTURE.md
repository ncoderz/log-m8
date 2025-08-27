# log-m8 Architecture

## Overview

log-m8 is a flexible, plugin-based logging system designed for TypeScript and JavaScript applications. The architecture emphasizes extensibility, performance, and hierarchical logger organization.

## Core Architecture

```mermaid
graph TB
    subgraph "Core Components"
        LogM8[LogM8<br/>Central Manager]
        PM[PluginManager]
        LogImpl[LogImpl<br/>Logger Instance]
    end
    
    subgraph "Plugin System"
        Appenders[Appenders<br/>Output Targets]
        Filters[Filters<br/>Event Filtering]
        Formatters[Formatters<br/>Output Format]
    end
    
    subgraph "Built-in Plugins"
        Console[ConsoleAppender]
        File[FileAppender]
        Default[DefaultFormatter]
        JSON[JsonFormatter]
        Match[MatchFilter]
    end
    
    LogM8 --> PM
    LogM8 --> LogImpl
    PM --> Appenders
    PM --> Filters  
    PM --> Formatters
    
    Appenders --> Console
    Appenders --> File
    Formatters --> Default
    Formatters --> JSON
    Filters --> Match
```

## Component Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant LogM8 as LogM8 Manager
    participant Logger as Logger Instance
    participant Filter as Filters
    participant Formatter as Formatter
    participant Appender as Appender
    
    App->>LogM8: getLogger('app.service')
    LogM8-->>App: Logger Instance
    App->>Logger: log.info('message', data)
    Logger->>Logger: Check log level
    Logger->>LogM8: processEvent(LogEvent)
    LogM8->>Filter: shouldLog(event)
    Filter-->>LogM8: true/false
    LogM8->>Formatter: format(event)
    Formatter-->>LogM8: formatted string
    LogM8->>Appender: append(formatted)
    Appender->>Appender: Output to target
```

## Hierarchical Logger System

```mermaid
graph TD
    Root[root<br/>level: info]
    App[app<br/>inherits: info]
    Service[app.service<br/>inherits: info]
    Database[app.service.database<br/>level: debug]
    API[app.api<br/>level: warn]
    
    Root --> App
    App --> Service
    Service --> Database
    App --> API
    
    style Database fill:#90EE90
    style API fill:#FFB6C1
```

## Plugin Architecture

### Plugin Factory Pattern

```mermaid
classDiagram
    class PluginFactory {
        <<interface>>
        +name: string
        +kind: PluginKindType
        +create(config): Plugin
    }
    
    class Plugin {
        <<interface>>
        +name: string
        +enabled: boolean
        +dispose(): void
    }
    
    class Appender {
        <<interface>>
        +append(message, event): void
        +flush(): void
    }
    
    class Filter {
        <<interface>>
        +shouldLog(event): boolean
    }
    
    class Formatter {
        <<interface>>
        +format(event): string
    }
    
    PluginFactory ..> Plugin : creates
    Plugin <|-- Appender
    Plugin <|-- Filter
    Plugin <|-- Formatter
```

## Key Design Patterns

### 1. Singleton Manager
- `LogM8` acts as the central singleton manager
- Manages all logger instances and plugin lifecycle
- Provides global configuration and control

### 2. Factory Pattern
- Plugin factories register with the manager
- Factories create plugin instances on demand
- Enables runtime plugin discovery and creation

### 3. Hierarchical Namespace
- Loggers organized in dot-notation hierarchy (e.g., `app.service.database`)
- Child loggers inherit parent configuration
- Allows fine-grained control at any level

### 4. Event Pipeline
- Log events flow through filters → formatters → appenders
- Each stage can modify or reject events
- Enables complex processing chains

## Data Flow

```mermaid
flowchart LR
    subgraph "Log Event Creation"
        A[Logger Method<br/>info/debug/error] --> B[Create LogEvent]
        B --> C{Level Check}
    end
    
    subgraph "Processing Pipeline"
        C -->|Pass| D[Apply Filters]
        D --> E{Filter Result}
        E -->|Pass| F[Format Event]
        F --> G[Send to Appenders]
    end
    
    subgraph "Output"
        G --> H[Console]
        G --> I[File]
        G --> J[Custom]
    end
    
    C -->|Fail| K[Discard]
    E -->|Fail| K
```

## Configuration System

```mermaid
graph TD
    Config[LoggingConfig]
    Config --> Level[Global Level]
    Config --> Loggers[Logger Configs]
    Config --> Appenders[Appender Configs]
    Config --> Filters[Filter Configs]
    Config --> Formatters[Formatter Configs]
    
    Loggers --> L1[app: debug]
    Loggers --> L2[app.api: warn]
    
    Appenders --> A1[console<br/>formatter: default]
    Appenders --> A2[file<br/>filename: app.log]
```

## Performance Considerations

### 1. Level Checking
- Log levels are pre-computed as numeric values
- Level checks use fast integer comparison
- Disabled log statements have minimal overhead

### 2. Event Buffering
- Pre-initialization events buffered (max 100)
- Automatic flush on first post-init log
- Prevents event loss during startup

### 3. Lazy Evaluation
- Message formatting deferred until needed
- Filters applied before expensive operations
- Appenders can batch writes

## Extension Points

### Custom Appenders
- Implement `Appender` interface
- Register factory with `PluginManager`
- Examples: Remote logging, database, metrics

### Custom Filters
- Implement `Filter` interface
- Chain multiple filters for complex logic
- Examples: Sampling, rate limiting, content filtering

### Custom Formatters
- Implement `Formatter` interface
- Transform `LogEvent` to any string format
- Examples: CSV, XML, custom JSON schemas

## Security Features

### 1. Input Validation
- All configuration validated on initialization
- Plugin names sanitized
- File paths checked for traversal attacks

### 2. Resource Management
- Automatic cleanup via `dispose()` methods
- File handles properly closed
- Memory buffers limited in size

### 3. Error Isolation
- Plugin errors don't crash the system
- Fallback to console on appender failure
- Graceful degradation of functionality

## Browser vs Node.js

### Build-time Separation
- Node.js-specific code wrapped in markers
- Separate builds for browser and Node.js
- File appender excluded from browser build

### Runtime Detection
- Environment automatically detected
- Appropriate defaults selected
- Console appender works everywhere

## Testing Architecture

```mermaid
graph LR
    subgraph "Test Categories"
        Unit[Unit Tests<br/>Component isolation]
        Integration[Integration Tests<br/>Component interaction]
        Performance[Performance Tests<br/>Benchmarks]
        Security[Security Tests<br/>Vulnerability checks]
    end
    
    Unit --> UT1[pluginManager.test.ts]
    Unit --> UT2[filter.test.ts]
    Integration --> IT1[logM8.integration.test.ts]
    Performance --> PT1[perf-disabled-logs.test.ts]
    Security --> ST1[filter-security.test.ts]
```

## Future Extensibility

The architecture supports future enhancements:
- Async appenders for remote logging
- Plugin marketplace/registry
- Dynamic plugin loading
- Configuration hot-reload
- Structured logging with OpenTelemetry
- Performance profiling hooks