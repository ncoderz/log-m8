# API Reference

Import the library:

```ts
import { Logging, LogLevel, LogM8Utils } from 'log-m8';
```

## Logging (manager)

- init(config?: LoggingConfig): void — configure levels, appenders, formatters, filters
- dispose(): void — flush and dispose plugins; can re-init later
- getLogger(name: string | string[]): Log — hierarchical names using dots; arrays join with '.'
- enableAppender(name): void / disableAppender(name): void
- flushAppender(name): void / flushAppenders(): void
- enableFilter(name: string, appenderName?: string): void / disableFilter(...): void
- registerPluginFactory(factory): void — add custom appenders/formatters/filters before init

## Log (per-logger)

- Methods: fatal, error, warn, info, debug, track, trace
- Flags: isEnabled, isFatal, isError, isWarn, isInfo, isDebug, isTrack, isTrace
- setLevel(level: LogLevelType)
- setContext(context: Record<string, unknown>)
- getLogger(child: string): Log — returns `${parent}.${child}`

Event shape: `{ logger, level, message, data[], context, timestamp }`

## Plugin names (built-in)

- Appenders: `console`, `file`
- Formatters: `default-formatter`, `json-formatter`
- Filters: `match-filter`

## Utilities (LogM8Utils)

- getPropertyByPath(obj, path): unknown — safe resolution for `a.b[0].c`
- formatTimestamp(date: Date, pattern: string): string — presets: 'iso' | 'locale' or custom tokens
- stringifyLog(value, options?, pretty?): string — safe JSON with limits
  - options: `{ maxDepth?: number, maxStringLength?: number, maxArrayLength?: number }`
  - pretty: `true` (2 spaces) | number (spaces) | undefined (compact)

## Configuration shapes (summary)

- LoggingConfig: `{ level?, loggers?, appenders?, filters? }`
- AppenderConfig: `{ name, enabled?, priority?, formatter?, filters? }`
- ConsoleAppenderConfig: `{ name: 'console', ...AppenderConfig }`
- FileAppenderConfig: `{ name: 'file', filename, append?, ... }`
- DefaultFormatterConfig: `{ name: 'default-formatter', format?, timestampFormat?, color? }`
- JsonFormatterConfig: `{ name: 'json-formatter', format?, timestampFormat?, pretty?, maxDepth?, maxStringLen?, maxArrayLen? }`
- MatchFilterConfig: `{ name: 'match-filter', allow?, deny?, enabled? }`

See also: configuration guide ./configuration.md and specs in ../spec.

Back to docs index: ./README.md | Project root: ../README.md
