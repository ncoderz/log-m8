# Appenders (destinations)

Appenders deliver formatted events to destinations. Built-in: `console` and `file`.

- Common contract: name, version, kind='appender', supportedLevels:Set, enabled:boolean, priority?:number, init(config, formatter?, filters?), write(event), flush(), dispose(), enableFilter(name), disableFilter(name).
- Skips writes when disabled or level unsupported. Local filters run before writes. Errors don’t crash logging.

## Console appender (`console`)

- Maps levels to console methods with graceful fallbacks: fatal/error→error|log, warn→warn|log, info→info|log, debug→debug|log, trace→debug|log (avoids stack traces), track→log
- Works in Node and modern browsers
- flush() is a no-op

Config:
```ts
{ name: 'console', enabled?: boolean, priority?: number, formatter?: FormatterConfig, filters?: FilterConfig[] }
```

Example:
```ts
Logging.init({ appenders: [{ name: 'console', formatter: 'default-formatter' }] });
```

## File appender (`file`, Node-only)

- Opens a WriteStream at init; `append` determines flags ('a' vs 'w')
- Joins tokens with a single space and adds a newline per event
- flush() is a no-op; dispose() ends the stream

Config:
```ts
{ name: 'file', filename: 'app.log', append?: boolean, enabled?: boolean, priority?: number, formatter?: FormatterConfig, filters?: FilterConfig[] }
```

Example:
```ts
Logging.init({
  appenders: [{ name: 'file', filename: 'app.log', formatter: 'json-formatter' }]
});
```

Back to docs index: ./README.md | Project root: ../README.md | Spec: ../spec/spec-appenders.md
