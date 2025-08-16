# Formatters (rendering)

Formatters convert Log Events into output tokens. Built-in: `default-formatter` (text) and `json-formatter`.

Common contract: name, version, kind='formatter', init(config), format(event): unknown[], dispose().

## Default text formatter (`default-formatter`)

- Token templates, optional multi-line
- Tokens: {timestamp}, {LEVEL}, {level}, {logger}, {message}, {data}, and dot-paths like {context.userId}
- Timestamp presets: 'iso' | 'locale'; custom tokens: yyyy, yy, MM, dd, hh, h, mm, ss, SSS, SS, S, A, a, z, zz
- Optional colorized {LEVEL}: ANSI in Node; CSS tuple for browsers
- {message} passes through as-is when non-string; {data} expands inline when used alone on a line

Config:
```ts
{
  name: 'default-formatter',
  options?: {
    format?: string | string[],
    timestampFormat?: string,
    color?: boolean
  }
}
```

Examples:
```ts
// Readable text
{ name: 'console', formatter: 'default-formatter' }

// Custom single-line
{ name: 'console', formatter: { name: 'default-formatter', options: {
  format: '{timestamp} {LEVEL} [{logger}] {message}',
  timestampFormat: 'hh:mm:ss.SSS',
  color: true
}}}

// Multi-line with data expansion
{ name: 'console', formatter: { name: 'default-formatter', options: {
  format: ['{timestamp} {LEVEL} [{logger}]', '{message}', '{data}']
}}}
```

## JSON formatter (`json-formatter`)

- Emits one JSON string per event
- Choose fields with `format` (defaults to `['timestamp','level','logger','message','data']`)
- Pretty printing: pretty=true (2 spaces) or pretty=number
- Timestamp formatting and safe stringification with depth/length limits
- Special fields: 'LEVEL' (raw lowercase level), 'timestamp' (formatted)

Config:
```ts
{
  name: 'json-formatter',
  options?: {
    format?: string | string[],
    timestampFormat?: string,
    pretty?: boolean | number,
    maxDepth?: number,
    maxStringLen?: number,
    maxArrayLen?: number
  }
}
```

Example:
```ts
{ name: 'console', formatter: { name: 'json-formatter', options: {
  format: ['timestamp','LEVEL','logger','context.userId','message'],
  pretty: 2
}}}
```

Back to docs index: ./README.md | Project root: ../README.md | Spec: ../spec/spec-formatters.md
