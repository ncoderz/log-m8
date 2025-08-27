# log-m8 Project Guide

## Overview
TypeScript/JavaScript logging system with plugin architecture for extensible logging capabilities.

## AI Tools
- **mermaid.js** - Use mermaid.js for drawing diagrams [mermaid docs](https://mermaid.js.org/intro/)


## Key Commands
```bash
npm run check       # Run typecheck + lint
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint checks
npm run test        # Run tests (Vitest)
npm run build       # Build distribution files
```

## Project Structure
- `src/` - Core library source code
  - `appenders/` - Output targets (Console, File)
  - `filters/` - Logging filters
  - `formatters/` - Output formatters (Default, JSON)
  - Main classes: `LogM8.ts`, `LogImpl.ts`, `PluginManager.ts`
- `test/` - Test suites (unit, integration, performance, security)
- `dist/` - Built distribution files (ESM, CJS, browser)

## Development Workflow
1. Always run `npm run check` before committing
2. Tests use Vitest framework
3. ESM module system with TypeScript
4. Zero runtime dependencies

## Key Features
- Hierarchical logger system
- Plugin-based architecture (appenders, filters, formatters)
- Multiple output formats and targets
- Browser & Node.js compatible

## Testing
- Unit tests: `test/unit/`
- Integration tests: `test/integration/`
- Performance tests: `test/performance/`
- Security tests: `test/security/`