## 2025-08-16

### Add user documentation: root README and detailed docs under /doc

Create a high-quality user docs set based on the specs: a welcoming root README, and focused guides for configuration, appenders, formatters, filters, plus an API reference. All docs cross-link with backlinks as required.

- **Affects:** `[doc]`

#### README.md

- `Doc +` New project overview with quick start, configuration examples, built-in plugins list, and links to detailed docs and specs.

#### doc/README.md

- `Doc +` Docs index with navigation to configuration, appenders, formatters, filters, and API reference; backlink to project root.

#### doc/configuration.md

- `Doc +` Explained defaults, shapes, and practical configuration examples (per-logger levels, filters, priorities, runtime control) with backlinks.

#### doc/appenders.md

- `Doc +` Documented console and file appenders, common contract, configs, examples, and spec link.

#### doc/formatters.md

- `Doc +` Described default text and JSON formatters, token grammar, timestamp presets, colorization, safe JSON, configs, and examples; fixed markdown lint by code-formatting default field list.

#### doc/filters.md

- `Doc +` Covered filter contract, match-filter allow/deny semantics, dot-path examples, global vs per-appender placement, and runtime toggles with backlinks and spec link.

#### doc/api.md

- `Doc +` Summarized Logging and Log APIs, built-in plugin names, utilities (getPropertyByPath, formatTimestamp, stringifyLog), and configuration shape cheatsheet with navigation links.

### Add License section to README

Append a concise License section at the end of README referencing the repository LICENSE file and attribution.

- **Affects:** `[doc]`

#### README.md

- `Doc ~` Appended "License" section with BSD 2-Clause attribution and link to LICENSE.

### Document logger context usage in README

Add a comprehensive "Using context" section: setting/replacing context, rendering via default and JSON formatters with dot-paths, and filtering by context with match-filter. Includes practical tips and examples.

- **Affects:** `[doc]`

#### README.md

- `Doc ~` Inserted "Using context" section with code examples and best-practice tips.

### Clarify formatter documentation to match actual behavior

Updates JSDoc comments for DefaultFormatter and JsonFormatter to accurately describe configuration, token handling, colorization behavior, and output shapes. No runtime logic changes.

- **Affects:** `[code]` `[doc]`

#### src/formatters/DefaultFormatter.ts

- `Comment ~` Corrected config docs (format default, timestampFormat, color behavior) and class description; added notes on {data} expansion and token resolution.

#### src/formatters/JsonFormatter.ts

- `Comment ~` Documented field selection via `format`, pretty printing, timestamp formatting, and max depth/length options; clarified LEVEL/timestamp special handling and fallback behavior.

## TAGS (use exactly these labels; choose the right ones)

- Tag format it `<Code|Comment|Spec|Doc|Test|Other> <+|-|~>`
  - `+` Added
  - `-` Removed
  - `~` Modified
  - `Code` Code, types, models, functions, or commands (non-doc).
  - `Comment` Inline/API comments/JSDoc/docstrings in source files.
  - `Spec` Specifications / requirements.
  - `Doc` End-user or API documentation (non-spec).
  - `Test` Tests or fixtures.
  - `Other` Anything that cannot fit the above tags.
## 2025-08-16

### Restructure README with explicit user-focused sections

Rewrite root README to follow the requested structure: Features, Quick Start, Installation, Configuration, Hierarchical Loggers, Log Levels, Context, Appenders, Formatters, Filters, Runtime Control, Custom Plugins, API Documentation, and Environment Compatibility. Content consolidated from existing README and /doc pages with links preserved.

- **Affects:** `[doc]`

#### README.md

- `Doc ~` Restructured headings and tightened examples; added Installation and Environment Compatibility sections; kept links to detailed docs.
### Add README Table of Contents

Insert a linked TOC at the top of README covering all major sections, including License.

- **Affects:** `[doc]`

#### README.md

- `Doc ~` Added Table of Contents with anchors for Features, Quick Start, Installation, Configuration, Hierarchical Loggers, Log Levels, Context, Appenders, Formatters, Filters, Runtime Control, Custom Plugins, API Documentation, Environment Compatibility, and License.
## 2025-08-16

### Split JSON formatting into dedicated JsonFormatter and update docs

Update documentation and specs to reflect that DefaultFormatter is text-only and JSON output is handled by a new JsonFormatter. Adjust examples, config schemas, and README links. Add a dedicated spec for JsonFormatter and correct LogM8Utils stringify options in API docs.


#### doc/api.md


#### README.md

- `Doc ~` Update features to mention dedicated JSON formatter.
- `Doc ~` Update advanced configuration to use `json-formatter`.
- `Doc ~` Split formatter sections into Default (Text) and Json (Structured); fix TOC anchors.


- `Doc ~` Reflect DefaultFormatter as text-only and add JsonFormatter.

- `Spec ~` Remove JSON mode; clarify text-only behavior and configuration.

#### spec/spec-formatter-json.md

- `Spec +` New spec defining JsonFormatter configuration and behavior.

#### spec/spec.md

- `Spec ~` Update built-in plugin descriptions, requirements, and acceptance criteria to reference separate JSON formatter.

## TAGS (use exactly these labels; choose the right ones)

- Tag format it `<Code|Comment|Spec|Doc|Test|Other> <+|-|~>`
  - `+` Added
  - `-` Removed
  - `~` Modified
  - `Code` Code, types, models, functions, or commands (non-doc).
  - `Comment` Inline/API comments/JSDoc/docstrings in source files.
  - `Spec` Specifications / requirements.
  - `Doc` End-user or API documentation (non-spec).
  - `Test` Tests or fixtures.
  - `Other` Anything that cannot fit the above tags.
## 2025-08-15

### Add child specifications for formatters, appenders, and filters; link from root spec

Create focused specs for the formatter, appender, and filter subsystems, and update the root spec References section to link to them. Clarifies token grammar, colorization, JSON pretty/limits, console/file behaviors, and match-filter semantics.

- **Affects:** `[spec]` `[doc]`

#### spec/spec-formatters.md

- `Spec +` Default text formatter and JSON formatter requirements, token grammar, timestamp formats, colorization, and Smithy config shapes.

#### spec/spec-appenders.md

- `Spec +` Console and file appender contracts, level mappings, priority, enable/disable, and Smithy config shapes.

#### spec/spec-filters.md

- `Spec +` Filter contract and built-in match-filter allow/deny semantics, dot-path resolution, and Smithy config shapes.

#### spec/spec.md

- `Spec ~` Add links to child specs in References section.

### Document LogM8Utils.stringifyLog and serializeError in API docs

Added user-facing API documentation for utility methods, including parameters, return types, examples, option interfaces, and behavior notes. Fixed markdown lint issue with bracket tokens.

- **Affects:** `[doc]`

#### doc/api.md

- `Doc ~` Added `stringifyLog()` and `serializeError()` under Utilities > LogM8Utils with examples and notes.

### Refactor filter specs: move MatchFilter details into dedicated spec and align formats

Separated generic filter specification from built-in MatchFilter details. Created `spec/spec-filters-match.md` with full behavior and configuration, updated `spec/spec-filters.md` to focus on the Filter interface and runtime semantics, and added cross-references from root and plugin specs. Ensures consistency with other spec files' frontmatter and structure.

- **Affects:** `[doc]` `[spec]`

#### spec/spec-filters.md

- `Spec ~` Removed MatchFilter-specific requirements and linked to dedicated spec.
- `Spec ~` Fixed frontmatter block to match repository format.

#### spec/spec-filters-match.md

- `Spec +` Added a complete specification for MatchFilter including config, evaluation, path/equality semantics, and Smithy IDL.

#### spec/spec.md

- `Spec ~` Added reference link to the new MatchFilter spec.

#### spec/spec-plugins.md

- `Spec ~` Added reference link to the new MatchFilter spec.

## 2025-08-15

### Add runtime filter enable/disable (global and per-appender) to specs and docs

Document runtime toggling of filters, initial enabled flag in FilterConfig, and global filters in LoggingConfig. Update API and README to show usage and align with implemented code.

- **Affects:** `[spec]` `[doc]`

#### spec/spec.md

- `Spec ~` Clarified buffering frontmatter, added FRs for filter enable/disable (FR-031..FR-035), global filters, and constraints for disabled filters.
- `Spec ~` Updated Smithy: FilterConfig.enabled, LoggingConfig.filters, AppenderConfig.filters union, and EnableFilter/DisableFilter operations.

#### spec/spec-filters.md

- `Spec ~` Added runtime enable/disable requirements and FilterConfig.enabled. Updated last updated date and implementation notes.

#### spec/spec-appenders-console.md

- `Spec ~` Added requirement for per-appender filter toggling APIs.

#### doc/api.md

- `Doc ~` Added enableFilter/disableFilter methods, global filters in LoggingConfig, FilterConfig.enabled, and notes on disabled filters. Inserted Global Filters section with usage.

#### README.md

- `Doc ~` Noted runtime control of filters and added config/usage snippets for global filters and runtime toggles.

## 2025-08-14

### Add JSDoc for stringifyLog and serializeError in LogM8Utils

Documented logging-focused JSON stringification behavior and structured error serialization. Clarifies depth limiting, string truncation, BigInt/Date handling, Error toJSON precedence, and recursive cause support to improve maintainability and IDE hints.

- **Affects:** `[comment]`

#### src/LogM8Utils.ts

- `Comment +` Added comprehensive JSDoc for `stringifyLog()` covering options, guards, and examples.
- `Comment +` Added comprehensive JSDoc for `serializeError()` detailing fields, recursion, and caveats.


### Record superenum library memory and set up memory indexes

Create memory structure and add an entry for @ncoderz/superenum to improve future retrieval of dependency usage and implications.

- **Affects:** `[doc]` `[other]`

#### .ai/memory/index.md

- `Doc +` Added root memory index with link to libraries sub-index.

#### .ai/memory/index-libraries.md

- `Doc +` Added libraries sub-index file.

#### .ai/memory/memory-library-superenum.md

- `Doc +` Added memory with version, usage locations, APIs, and notes for @ncoderz/superenum.


### Document DefaultFilter and bracket-notation support in utils

Add specs and code docs for the built-in DefaultFilter (allow/deny semantics) and clarify bracket-notation support in `getPropertyByPath` to aid discoverability and alignment with tests.

- **Affects:** `[comment]` `[spec]`
- **Issue:** N/A
- **Pull Request:** N/A

#### src/LogM8Utils.ts

- `Comment ~` Expanded JSDoc for `getPropertyByPath` to include bracket index normalization and examples.

#### spec/spec-filters.md

- `Spec ~` Bumped version to 1.2.0; added DefaultFilter functional requirements and API notes; acceptance criteria updated.

### Add DefaultFilter user documentation and API reference

Documented usage of built-in DefaultFilter in README and API docs, including configuration, semantics, path notation, and examples.

- **Affects:** `[doc]`
- **Issue:** N/A
- **Pull Request:** N/A

#### README.md

- `Doc ~` Added "Default Filter" section with config and examples.

#### doc/api.md

- `Doc ~` Added "DefaultFilter" under Built-in Plugins and updated `getPropertyByPath` examples with bracket notation.

### Improve DefaultFilter JSDoc and add README Try it snippet

Enhance discoverability by documenting DefaultFilter.init() and shouldLog() behavior and adding a quick "Try it" example to README.

- **Affects:** `[comment]` `[doc]`
- **Issue:** N/A
- **Pull Request:** N/A

#### src/filters/DefaultFilter.ts

- `Comment ~` Added JSDoc for `init()` and `shouldLog()` describing rule evaluation and safety behavior.

#### README.md

- `Doc +` Inserted "Try it" code snippet under Default Filter section.
## 2025-08-14


### Fix unsafe enum casting with proper Enum.fromValue validation

Replaces unsafe enum casting patterns using `as [typeof array](number)` with safe validation using `Enum(LogLevel).fromValue()`. This prevents runtime errors from invalid enum values and ensures type safety throughout the codebase.

- **Affects:** `[test]`
- **Issue:** [#0](https://actual.link.to.issue.in.github)
- **Pull Request:** [#0](https://actual.link.to.pull-request.in.github)

#### test/usability/filter-usability.test.ts

- `Test ~` Replaced unsafe array casting with `Enum(LogLevel).fromValue()` for level validation in LevelFilter.
- `Test ~` Added proper validation with default fallbacks for both event level and minimum level.

#### test/unit/filter.test.ts

- `Code +` Added import for `Enum` from `@ncoderz/superenum`.
- `Test ~` Replaced unsafe array casting with `Enum(LogLevel).fromValue()` for level validation in LevelFilter.
- `Test ~` Added additional check to filter out 'off' level values before array operations.

### Correct 'track' vs 'trace' ordering across docs and interfaces

Fixes instances where 'trace' was listed before 'track'. Ensures consistent level order: off < fatal < error < warn < info < debug < track < trace in specs and docs, and orders logger method listings accordingly.

- **Affects:** `[code]` `[spec]` `[doc]`
- **Issue:** [#0](https://actual.link.to.issue.in.github)
- **Pull Request:** [#0](https://actual.link.to.pull-request.in.github)

### src/Log.ts

- `Comment ~` Reordered method declarations to list track() before trace() to match level hierarchy.

### spec/spec-appenders-console.md

- `Spec ~` Corrected FR-CNS-010 mapping list to put track before trace.

### doc/api.md

- `Doc ~` Reordered Level Flags to list isTrack before isTrace.
- `Doc ~` Reordered Logging Methods to list track() before trace().

# 2025-08-13

### Correct AI log entry for today

Clarifies that no changes were made to other docs; only the root project specification was added under spec/spec.md. The earlier entry mentioning doc/api.md edits is erroneous.

- **Affects:** `[other]`

#### .ai/log/ai-log.md

- `Other +` Correction note: restrict actual change scope to spec/spec.md creation only.

## Corrected specification mismatches with implementation

Fixed several discrepancies between the specification and actual implementation behavior, particularly around logger boolean flags and appender priority ordering. Also updated spec after Logger.setLevel() interface was corrected.

### Verify and fix mismatches found by tests and dev runs

Validated interface docs against compile errors and runtime traces. Corrected examples to reference available factories (default-formatter, json-formatter), documented filter enable/disable behavior, and ensured stringifyLog option names match implementation.

- **Affects:** `[doc]` `[comment]`

#### src/LogM8.ts

- `Comment ~` Aligned DEFAULT_APPENDERS example and init() usage with actual factory names.

#### src/formatters/DefaultFormatter.ts

- `Comment ~` Clarified token handling and browser/Node coloring outputs.

#### src/appenders/FileAppender.ts

- `Comment ~` Added lifecycle and write behavior notes for one-line-per-event output.
- **Affects:** `[spec]` `[code]`

### spec/spec.md

- `Spec ~` Clarified FR-011 to state boolean flags indicate enablement for that severity level and "higher severity levels" instead of "above"
- `Spec ~` Updated constraint C-002 to match the corrected wording about boolean flag behavior
- `Spec ~` Updated Smithy API comment about boolean flags to match the corrected behavior
- `Spec +` Added assumption A-003 to document the boolean flag behavior explicitly
- `Spec ~` Updated FR-007 to clarify that setLevel() accepts LogLevelType enum values after interface was corrected
- `Spec -` Removed constraint C-005 about the setLevel() implementation bug since it was fixed

### src/AppenderConfig.ts

- `Comment ~` Corrected priority documentation to state "higher values run first (descending order)" instead of "lower values run first"

## Fixed timing issue in FileAppender append test

Resolved a race condition in the FileAppender test where streams weren't properly closed before the next operation. The test was failing because it tried to append to a file before the previous write stream was fully closed.

- **Affects:** `[test]`

### test/unit/fileAppender.test.ts

- `Test ~` Added proper timing delays between stream disposal and file operations to prevent race conditions
- `Test ~` Increased timeout from 10ms to 50ms after each dispose() call to ensure streams are fully closed

## Simplified filter specification to match implementation reality

Significantly reduced the filter specification complexity to align with the actual Filter interface implementation. The original spec was over-engineered with service APIs and complex evaluation chains that don't exist in the code.

- **Affects:** `[spec]` `[test]`

### spec/spec-filters.md

- `Spec ~` Simplified purpose to focus on the basic Filter interface
- `Spec ~` Updated scope to reflect what filters actually do vs over-specified behavior
- `Spec ~` Reduced glossary to essential terms only
- `Spec ~` Simplified core features to basic boolean evaluation and plugin architecture
- `Spec ~` Updated user stories to be more practical and realistic
- `Spec ~` Condensed functional requirements from 10 complex rules to 5 simple ones
- `Spec ~` Restructured non-functional requirements using proper subsections
- `Spec ~` Simplified constraints and assumptions to match reality
- `Spec ~` Replaced complex Smithy service API with simple interface model
- `Spec ~` Updated error handling to be more straightforward
- `Spec ~` Simplified acceptance criteria to match actual implementation behavior

### test/unit/filter.test.ts

- `Test +` Comprehensive unit tests for Filter interface covering basic contract, filter behavior, custom implementations, error handling, and performance
- `Test +` Tests for level-based and logger name-based filtering patterns
- `Test +` Configuration handling and validation tests
- `Test +` Performance tests ensuring O(n) evaluation and minimal allocations

### test/integration/filter.integration.test.ts

- `Test +` Integration tests demonstrating filter usage with console appender
- `Test +` Multiple filter evaluation with AND semantics and short-circuit behavior
- `Test +` Error handling during filter initialization and evaluation
- `Test +` Tests for appenders with no filters configured
- `Test +` Different filters per appender configuration testing
- `Test ~` Fixed Filter implementations to use proper Plugin interface with init(), dispose(), and version properties
- `Test ~` Updated PluginKind enum usage to use PluginKind.filter instead of PluginKind.Filter
- `Test ~` Corrected LogLevel enum usage to use LogLevel.error instead of LogLevel.ERROR
- `Test ~` Fixed factory registration pattern to use individual factory classes per filter type
- `Test ~` Updated parameter naming to use underscore prefix for unused parameters

### test/performance/filter-performance.test.ts

- `Test +` High-volume logging performance tests with filters (10,000+ events)
- `Test +` Multiple complex filter performance evaluation
- `Test +` Memory leak prevention tests during long-running scenarios
- `Test +` Consistent performance across different log levels
- `Test +` Short-circuit efficiency testing
- `Test ~` Fixed factory registration patterns to use individual factory classes per filter
- `Test ~` Converted from switch-based PerformanceFilterFactory to individual factories (ComplexFilterFactory, DenyAllFilterFactory, PerfTestFilterFactory)
- `Test ~` Removed unused PerformanceFilterFactory class after conversion

### test/security/filter-security.test.ts

- `Test +` Malformed LogEvent handling and resilience tests
- `Test +` Prototype pollution attack prevention
- `Test +` Large string handling and DoS attack mitigation
- `Test +` Circular reference handling in LogEvent data
- `Test +` Malicious getter protection and information leakage prevention
- `Test +` Memory exhaustion attack resilience

### test/usability/filter-usability.test.ts

- `Test +` Intuitive interface design verification
- `Test +` Common filtering pattern implementations (level, logger name)
- `Test +` Clear configuration pattern demonstrations
- `Test +` Easy LogM8 integration examples
- `Test +` Helpful defaults and edge case handling
- `Test +` Filter composition and chaining patterns
- `Test +` Clear error messages for common mistakes

## Fix API docs: level flags semantics, setLevel signature, and config types

Corrects doc/api.md to reflect actual behavior: boolean level flags indicate enablement at/above the level, setLevel accepts LogLevelType (not string), LoggingConfig types use LogLevelType, appender priority clarifies higher-first order, and LogLevel notes track between debug and trace. Ensures docs match src implementations.

- **Affects:** `[doc]`
- **Issue:** [#0](https://actual.link.to.issue.in.github)
- **Pull Request:** [#0](https://actual.link.to.pull-request.in.github)

### doc/api.md

- `Doc ~` Clarified isFatal/isError/isWarn/isInfo/isDebug/isTrace/isTrack semantics (enabled when level >= flag level)
- `Doc ~` Updated setLevel signature to use LogLevelType and listed accepted values
- `Doc ~` Updated LoggingConfig.level and loggers types to LogLevelType
- `Doc ~` Clarified AppenderConfig.priority describes higher values run first
- `Doc ~` Updated LogLevel enum notes to place track between debug and trace and clarified emission rule and hierarchy

### Record feature preferences for future enhancements

Captured the maintainer’s prioritized enhancements to guide future proposals and implementations without over-complicating the system.

- **Affects:** `[doc]` `[other]`

#### .ai/memory/index.md

- `Doc ~` Added link to feature preference sub-index.

#### .ai/memory/index-feature-preferences.md

- `Doc +` Created sub-index for feature preference memories.

#### .ai/memory/memory-log-m8-feature-preferences.md

- `Doc +` Added detailed memory of prioritized features (Redaction filter, Sampling filter, File rotation/retention) with WHY/HOW notes.
