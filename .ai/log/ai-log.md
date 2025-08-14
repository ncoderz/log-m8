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

## Corrected specification mismatches with implementation

Fixed several discrepancies between the specification and actual implementation behavior, particularly around logger boolean flags and appender priority ordering. Also updated spec after Logger.setLevel() interface was corrected.

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
